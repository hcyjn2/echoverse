import { existsSync } from "node:fs";

import {
  createZGComputeNetworkBroker,
  createZGComputeNetworkReadOnlyBroker,
  type ServiceWithDetail,
} from "@0glabs/0g-serving-broker";
import { JsonRpcProvider, Wallet } from "ethers";

const DEFAULT_RPC_URL = "https://evmrpc-testnet.0g.ai";
const GALILEO_CHAIN_ID = BigInt(16602);
const DEFAULT_MODEL = "qwen-2.5-7b-instruct";
const DEFAULT_PROMPT =
  "Write one short EchoVerse onboarding message from an upbeat AI travel creator.";

type ChatCompletionResponse = {
  id?: string;
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  usage?: unknown;
};

type LoadEnvProcess = NodeJS.Process & {
  loadEnvFile?: (path?: string) => void;
};

function loadLocalEnv() {
  const processWithEnvLoader = process as LoadEnvProcess;

  for (const file of [".env.local", ".env"]) {
    if (existsSync(file)) {
      processWithEnvLoader.loadEnvFile?.(file);
    }
  }
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function serviceSearchText(service: ServiceWithDetail) {
  return [
    service.model,
    service.serviceType,
    service.modelInfo?.id,
    service.modelInfo?.name,
    service.modelInfo?.description,
    service.modelInfo?.owned_by,
  ]
    .filter(Boolean)
    .join(" ");
}

function isLikelyChatService(service: ServiceWithDetail) {
  const serviceType = service.serviceType.toLowerCase();
  const modelType = service.modelInfo?.type?.toLowerCase() ?? "";
  const outputModalities = service.modelInfo?.architecture?.output_modalities ?? [];

  return (
    serviceType.includes("chat") ||
    serviceType.includes("llm") ||
    serviceType.includes("text") ||
    modelType.includes("chat") ||
    modelType.includes("language") ||
    outputModalities.includes("text")
  );
}

function selectProvider(services: ServiceWithDetail[], targetModel: string) {
  const target = normalize(targetModel);
  const acknowledgedServices = services.filter(
    (service) => service.teeSignerAcknowledged
  );
  const candidates = acknowledgedServices.length > 0 ? acknowledgedServices : services;

  const exact = candidates.find((service) =>
    normalize(serviceSearchText(service)).includes(target)
  );

  if (exact) {
    return exact;
  }

  return candidates.find((service) => {
    const text = normalize(serviceSearchText(service));
    return text.includes("qwen") && isLikelyChatService(service);
  });
}

function formatService(service: ServiceWithDetail) {
  return `${service.provider} | model=${service.model || "unknown"} | type=${
    service.serviceType || "unknown"
  } | tee=${service.teeSignerAcknowledged ? "acknowledged" : "unacknowledged"}`;
}

function requireEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }

  return value;
}

function requirePrivateKey() {
  const rawValue = requireEnv("PRIVATE_KEY").replace(/^["']|["']$/g, "");
  const privateKey = rawValue.startsWith("0x") ? rawValue : `0x${rawValue}`;

  if (/^0x[a-fA-F0-9]{40}$/.test(privateKey)) {
    throw new Error(
      "PRIVATE_KEY looks like a wallet address. Export the account private key from MetaMask, not the public address."
    );
  }

  if (rawValue.trim().includes(" ")) {
    throw new Error(
      "PRIVATE_KEY looks like a seed phrase. Export the single account private key from MetaMask instead."
    );
  }

  if (!/^0x[a-fA-F0-9]{64}$/.test(privateKey)) {
    throw new Error(
      "PRIVATE_KEY must be a 64-character hex private key, with or without a 0x prefix."
    );
  }

  return privateKey;
}

async function main() {
  loadLocalEnv();

  const rpcUrl = process.env.RPC_URL?.trim() || DEFAULT_RPC_URL;
  const privateKey = requirePrivateKey();
  const targetModel = process.env.INFERENCE_MODEL?.trim() || DEFAULT_MODEL;
  const prompt = process.env.INFERENCE_PROMPT?.trim() || DEFAULT_PROMPT;

  console.log("0G inference spike");
  console.log(`RPC: ${rpcUrl}`);
  console.log(`Target model: ${targetModel}`);

  const readOnlyBroker = await createZGComputeNetworkReadOnlyBroker(
    rpcUrl,
    Number(GALILEO_CHAIN_ID)
  );
  const services = await readOnlyBroker.inference.listServiceWithDetail(0, 50, true);
  const selectedService = selectProvider(services, targetModel);

  if (!selectedService) {
    const available = services.slice(0, 12).map(formatService).join("\n");
    throw new Error(
      `No Qwen provider found. Available providers:\n${available || "none"}`
    );
  }

  console.log(`Selected provider: ${formatService(selectedService)}`);

  const provider = new JsonRpcProvider(rpcUrl);
  const network = await provider.getNetwork();

  if (network.chainId !== GALILEO_CHAIN_ID) {
    throw new Error(
      `RPC is on chain ${network.chainId.toString()}, expected ${GALILEO_CHAIN_ID.toString()}`
    );
  }

  const wallet = new Wallet(privateKey, provider);
  const broker = await createZGComputeNetworkBroker(wallet);

  console.log(`Signer: ${wallet.address}`);

  const signerStatus = await broker.inference.checkProviderSignerStatus(
    selectedService.provider
  );

  if (!signerStatus.isAcknowledged) {
    throw new Error(
      `Provider TEE signer is not acknowledged by the contract owner: ${selectedService.provider}`
    );
  }

  const userAcknowledged = await broker.inference.acknowledged(
    selectedService.provider
  );

  if (!userAcknowledged) {
    console.log("Acknowledging provider signer...");
    await broker.inference.acknowledgeProviderSigner(selectedService.provider);
  } else {
    console.log("Provider signer already acknowledged by user.");
  }

  const { endpoint, model } = await broker.inference.getServiceMetadata(
    selectedService.provider
  );
  const requestBody = {
    model,
    messages: [
      {
        role: "system",
        content:
          "You are an EchoVerse AI social agent. Reply with one concise, vivid message.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.7,
    max_tokens: 120,
  };
  const serializedBody = JSON.stringify(requestBody);
  const headers = await broker.inference.getRequestHeaders(
    selectedService.provider,
    serializedBody
  );

  console.log(`Calling ${endpoint}/chat/completions with model ${model}...`);

  const response = await fetch(`${endpoint}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: serializedBody,
  });

  if (!response.ok) {
    throw new Error(
      `Inference request failed: ${response.status} ${response.statusText}\n${await response.text()}`
    );
  }

  const completion = (await response.json()) as ChatCompletionResponse;
  const reply = completion.choices?.[0]?.message?.content;

  if (!reply) {
    throw new Error(`Inference response did not include a reply:\n${JSON.stringify(completion, null, 2)}`);
  }

  const chatId = response.headers.get("ZG-Res-Key") || completion.id;

  if (chatId) {
    const verificationResult = await broker.inference.processResponse(
      selectedService.provider,
      chatId,
      JSON.stringify(completion.usage ?? {})
    );

    console.log(`Response verification: ${verificationResult ?? "skipped"}`);
  }

  console.log("\nLLM response:");
  console.log(reply);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`\nInference spike failed:\n${message}`);
  process.exitCode = 1;
});
