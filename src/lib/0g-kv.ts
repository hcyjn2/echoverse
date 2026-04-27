import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import {
  calculatePrice,
  defaultUploadOption,
  getFlowContract,
  Indexer,
  KvClient,
  MemData,
  StreamDataBuilder,
  Uploader,
} from "@0glabs/0g-ts-sdk";
import { encodeBase64, ethers } from "ethers";

import { getIndexerRpc, getKvRpc, getPrivateKey, getRpcUrl } from "./env.ts";

export const ECHOVERSE_STREAM_ID =
  process.env.ZG_KV_STREAM_ID?.trim() || ethers.id("echoverse:onboarding:v1");
const DEFAULT_LOCAL_KV_PATH = join(process.cwd(), "data", "local-kv.json");

type StorageMode = "0g" | "local" | "auto";

type KvContext = {
  indexer: Indexer;
  kvClient: KvClient;
  rpcUrl: string;
  signer: ethers.Wallet;
};

type LocalKvStore = Record<string, string>;
type StorageSubmission = {
  length: number | bigint;
  tags: ethers.BytesLike;
  nodes: Array<{
    root: string;
    height: number | bigint;
  }>;
};

type StorageUploadOption = typeof defaultUploadOption;
type UploaderRuntime = {
  flow: {
    market: () => Promise<string>;
  };
  gasPrice: bigint;
  gasLimit: bigint;
  submitTransaction: (
    submission: StorageSubmission,
    opts: StorageUploadOption
  ) => Promise<[ethers.TransactionReceipt | null, Error | null]>;
};

let kvContextPromise: Promise<KvContext> | null = null;
const FLOW_SUBMIT_COMPAT_ABI = [
  "function submit(((uint256 length, bytes tags, tuple(bytes32 root,uint256 height)[] nodes) data, address submitter) submission) payable returns (uint256 index, bytes32 digest, uint256 startIndex, uint256 length)",
];
const MARKET_PRICE_ABI = ["function pricePerSector() view returns (uint256)"];

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function textBytes(value: string) {
  return Uint8Array.from(Buffer.from(value, "utf-8"));
}

function getStorageMode(): StorageMode {
  const storageMode = process.env.STORAGE_MODE?.trim().toLowerCase() || "auto";

  if (storageMode === "0g" || storageMode === "local" || storageMode === "auto") {
    return storageMode;
  }

  return "auto";
}

function getLocalKvPath() {
  return process.env.LOCAL_KV_PATH?.trim() || DEFAULT_LOCAL_KV_PATH;
}

function getWriteRetries() {
  const rawValue = Number.parseInt(process.env.KV_WRITE_RETRIES ?? "2", 10);

  if (!Number.isFinite(rawValue)) {
    return 2;
  }

  return Math.min(Math.max(rawValue, 1), 5);
}

function getRetryDelayMs(attempt: number) {
  const rawValue = Number.parseInt(process.env.KV_RETRY_DELAY_MS ?? "750", 10);
  const baseDelay = Number.isFinite(rawValue) ? Math.max(rawValue, 100) : 750;

  return baseDelay * attempt;
}

function getReadTimeoutMs() {
  const rawValue = Number.parseInt(process.env.KV_READ_TIMEOUT_MS ?? "15000", 10);

  if (!Number.isFinite(rawValue)) {
    return 15000;
  }

  return Math.min(Math.max(rawValue, 1000), 60000);
}

function shouldMirror0GWritesLocal() {
  return process.env.MIRROR_0G_WRITES_LOCAL?.trim().toLowerCase() !== "false";
}

function localStoreKey(streamId: string, key: string) {
  return `${streamId}:${key}`;
}

function errorToMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

async function withTimeout<T>(operation: Promise<T>, timeoutMs: number, label: string) {
  let timeout: NodeJS.Timeout | null = null;

  try {
    return await Promise.race([
      operation,
      new Promise<T>((_, reject) => {
        timeout = setTimeout(() => {
          reject(new Error(`${label} timed out after ${timeoutMs}ms.`));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}

function isRetryableStorageError(error: unknown) {
  const message = errorToMessage(error).toLowerCase();

  if (
    message.includes("execution reverted") ||
    message.includes("call_exception") ||
    message.includes("insufficient funds") ||
    message.includes("missing required env var")
  ) {
    return false;
  }

  return [
    "econnreset",
    "econnrefused",
    "etimedout",
    "fetch failed",
    "getaddrinfo",
    "timeout",
    "too many requests",
    "503",
    "502",
    "504",
  ].some((fragment) => message.includes(fragment));
}

async function readLocalStore(): Promise<LocalKvStore> {
  try {
    return JSON.parse(await readFile(getLocalKvPath(), "utf8")) as LocalKvStore;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return {};
    }

    throw error;
  }
}

async function writeLocalStore(store: LocalKvStore) {
  const localKvPath = getLocalKvPath();
  await mkdir(dirname(localKvPath), { recursive: true });
  await writeFile(localKvPath, `${JSON.stringify(store, null, 2)}\n`);
}

async function writeLocalKV(
  key: string,
  value: string,
  streamId: string,
  fallbackReason?: string
) {
  const store = await readLocalStore();
  store[localStoreKey(streamId, key)] = value;
  await writeLocalStore(store);

  return {
    txHash: "",
    rootHash: "",
    streamId,
    key,
    backend: "local" as const,
    fallbackReason,
  };
}

async function readLocalKV(key: string, streamId: string) {
  const store = await readLocalStore();
  return store[localStoreKey(streamId, key)] ?? null;
}

async function getKvContext() {
  if (kvContextPromise) {
    return kvContextPromise;
  }

  kvContextPromise = Promise.resolve().then(() => {
    const rpcUrl = getRpcUrl();
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const signer = new ethers.Wallet(getPrivateKey(), provider);

    return {
      indexer: new Indexer(getIndexerRpc()),
      kvClient: new KvClient(getKvRpc()),
      rpcUrl,
      signer,
    };
  });

  return kvContextPromise;
}

function buildUploadOptions(tags: ethers.BytesLike): StorageUploadOption {
  return {
    ...defaultUploadOption,
    tags,
  };
}

async function getSuggestedGasPrice(provider: ethers.JsonRpcProvider) {
  const gasPrice = (await provider.getFeeData()).gasPrice;

  if (gasPrice === null) {
    throw new Error("Failed to get suggested gas price.");
  }

  return gasPrice;
}

function patchUploaderForCurrentFlowAbi(
  uploader: Uploader,
  flowAddress: string,
  signer: ethers.Wallet
) {
  const patchedUploader = uploader as unknown as UploaderRuntime;

  patchedUploader.submitTransaction = async (submission, opts) => {
    try {
      const provider = new ethers.JsonRpcProvider(getRpcUrl());
      const flowContract = new ethers.Contract(
        flowAddress,
        FLOW_SUBMIT_COMPAT_ABI,
        signer
      );
      const marketAddress = await patchedUploader.flow.market();
      const marketContract = new ethers.Contract(
        marketAddress,
        MARKET_PRICE_ABI,
        provider
      );
      const pricePerSector = await marketContract.pricePerSector();
      const fee = opts.fee > 0 ? opts.fee : calculatePrice(submission, pricePerSector);
      const txOpts: ethers.TransactionRequest = {
        value: fee,
        gasPrice: await getSuggestedGasPrice(provider),
      };

      if (opts.nonce !== undefined) {
        txOpts.nonce = Number(opts.nonce);
      }

      if (patchedUploader.gasPrice > 0) {
        txOpts.gasPrice = patchedUploader.gasPrice;
      }

      if (patchedUploader.gasLimit > 0) {
        txOpts.gasLimit = patchedUploader.gasLimit;
      }

      console.log("Submitting transaction with storage fee:", fee);

      const response = await flowContract.submit(
        {
          data: submission,
          submitter: await signer.getAddress(),
        },
        txOpts
      );
      const receipt = await response.wait();

      if (receipt === null) {
        throw new Error("Send transaction timeout");
      }

      return [receipt, null];
    } catch (error) {
      return [
        null,
        new Error(`Failed to submit transaction with current Flow ABI: ${errorToMessage(error)}`),
      ];
    }
  };

  return uploader;
}

async function write0GKV(key: string, value: string, streamId: string) {
  const context = await getKvContext();
  const [nodes, nodesError] = await context.indexer.selectNodes(1);

  if (nodesError !== null) {
    throw nodesError;
  }

  const status = await nodes[0]?.getStatus();
  const flowAddress = status?.networkIdentity?.flowAddress;

  if (!flowAddress) {
    throw new Error("Unable to discover 0G Storage flow contract from selected node.");
  }

  const flowContract = getFlowContract(flowAddress, context.signer as never);
  const streamDataBuilder = new StreamDataBuilder(1);

  streamDataBuilder.set(streamId, textBytes(key), textBytes(value));

  const streamData = streamDataBuilder.build();
  const data = new MemData(streamData.encode());
  const uploader = patchUploaderForCurrentFlowAbi(
    new Uploader(nodes, context.rpcUrl, flowContract),
    flowAddress,
    context.signer
  );
  const [tx, uploadError] = await uploader.uploadFile(
    data,
    buildUploadOptions(streamDataBuilder.buildTags())
  );

  if (uploadError !== null) {
    throw uploadError;
  }

  return tx;
}

async function write0GKVWithRetry(key: string, value: string, streamId: string) {
  let lastError: unknown = null;
  const maxAttempts = getWriteRetries();

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const tx = await write0GKV(key, value, streamId);

      return {
        ...tx,
        attempts: attempt,
      };
    } catch (error) {
      lastError = error;

      if (attempt >= maxAttempts || !isRetryableStorageError(error)) {
        throw error;
      }

      await sleep(getRetryDelayMs(attempt));
    }
  }

  throw lastError;
}

export async function writeKV(
  key: string,
  value: string,
  streamId = ECHOVERSE_STREAM_ID
) {
  if (!key.trim()) {
    throw new Error("KV key is required.");
  }

  const mode = getStorageMode();

  if (mode === "local") {
    return writeLocalKV(key, value, streamId);
  }

  try {
    const tx = await write0GKVWithRetry(key, value, streamId);

    if (mode === "auto" && shouldMirror0GWritesLocal()) {
      await writeLocalKV(key, value, streamId);
    }

    return {
      ...tx,
      streamId,
      key,
      backend: "0g" as const,
      mirroredLocal: mode === "auto" && shouldMirror0GWritesLocal(),
    };
  } catch (error) {
    if (mode === "0g") {
      throw error;
    }

    return writeLocalKV(key, value, streamId, errorToMessage(error));
  }
}

export async function readKV(key: string, streamId = ECHOVERSE_STREAM_ID) {
  if (!key.trim()) {
    throw new Error("KV key is required.");
  }

  const mode = getStorageMode();

  if (mode === "local") {
    return readLocalKV(key, streamId);
  }

  if (mode === "auto") {
    const localValue = await readLocalKV(key, streamId);

    if (localValue !== null) {
      return localValue;
    }
  }

  try {
    const context = await getKvContext();
    const value = await withTimeout(
      context.kvClient.getValue(streamId, encodeBase64(textBytes(key)) as never),
      getReadTimeoutMs(),
      "0G KV read"
    );

    if (!value) {
      return mode === "auto" ? readLocalKV(key, streamId) : null;
    }

    return Buffer.from(value.data, "base64").toString("utf-8");
  } catch (error) {
    if (mode === "0g") {
      throw error;
    }

    return readLocalKV(key, streamId);
  }
}
