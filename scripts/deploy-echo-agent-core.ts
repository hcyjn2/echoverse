import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";

import solc from "solc";
import {
  Contract,
  ContractFactory,
  type InterfaceAbi,
  JsonRpcProvider,
  Wallet,
} from "ethers";

import { agents } from "../src/data/agents.ts";

const CONTRACT_PATH = "contracts/EchoAgentCore.sol";
const CONTRACT_NAME = "EchoAgentCore";
const DEPLOYMENT_PATH = "deployments/echo-agent-core.galileo.json";
const DEFAULT_RPC_URL = "https://evmrpc-testnet.0g.ai";
const GALILEO_CHAIN_ID = BigInt(16602);

type LoadEnvProcess = NodeJS.Process & {
  loadEnvFile?: (path?: string) => void;
};

type SolcContractOutput = {
  abi: InterfaceAbi;
  evm: {
    bytecode: {
      object: string;
    };
  };
};

function loadLocalEnv() {
  const processWithEnvLoader = process as LoadEnvProcess;

  for (const file of [".env.local", ".env"]) {
    if (existsSync(file)) {
      processWithEnvLoader.loadEnvFile?.(file);
    }
  }
}

function requirePrivateKey() {
  const rawValue = process.env.PRIVATE_KEY?.trim().replace(/^["']|["']$/g, "");
  const privateKey = rawValue?.startsWith("0x") ? rawValue : `0x${rawValue}`;

  if (!privateKey || !/^0x[a-fA-F0-9]{64}$/.test(privateKey)) {
    throw new Error("PRIVATE_KEY must be a 64-character hex private key.");
  }

  return privateKey;
}

async function compileContract() {
  const source = await readFile(CONTRACT_PATH, "utf8");
  const input = {
    language: "Solidity",
    sources: {
      [CONTRACT_PATH]: {
        content: source,
      },
    },
    settings: {
      evmVersion: "cancun",
      optimizer: {
        enabled: true,
        runs: 200,
      },
      outputSelection: {
        "*": {
          "*": ["abi", "evm.bytecode"],
        },
      },
    },
  };
  const output = JSON.parse(solc.compile(JSON.stringify(input)));
  const errors = (output.errors ?? []).filter(
    (entry: { severity: string }) => entry.severity === "error"
  );

  if (errors.length > 0) {
    throw new Error(errors.map((entry: { formattedMessage: string }) => entry.formattedMessage).join("\n"));
  }

  const contract = output.contracts?.[CONTRACT_PATH]?.[
    CONTRACT_NAME
  ] as SolcContractOutput | undefined;

  if (!contract?.abi || !contract.evm?.bytecode?.object) {
    throw new Error(`Unable to compile ${CONTRACT_NAME}.`);
  }

  return contract;
}

async function getSavedDeploymentAddress() {
  if (!existsSync(DEPLOYMENT_PATH)) {
    return undefined;
  }

  const deployment = JSON.parse(await readFile(DEPLOYMENT_PATH, "utf8")) as {
    address?: string;
  };

  return deployment.address;
}

async function registerAgents(contract: Contract, ownerAddress: string) {
  for (const agent of agents) {
    const existing = await contract.getAgent(agent.id);

    if (existing.registered) {
      console.log(`Already seeded: ${agent.id}`);
      continue;
    }

    const paymentWallet =
      agent.walletAddress.startsWith("0x100000000000000000000000000000000000000")
        ? ownerAddress
        : agent.walletAddress;

    const tx = await contract.registerAgent(
      agent.id,
      agent.metadataKey,
      agent.displayName,
      agent.interests.join(","),
      paymentWallet
    );
    console.log(`Seed tx for ${agent.id}: ${tx.hash}`);
    await tx.wait();
  }
}

async function main() {
  loadLocalEnv();

  const rpcUrl = process.env.RPC_URL?.trim() || DEFAULT_RPC_URL;
  const provider = new JsonRpcProvider(rpcUrl);
  const network = await provider.getNetwork();

  if (network.chainId !== GALILEO_CHAIN_ID) {
    throw new Error(
      `RPC is on chain ${network.chainId.toString()}, expected ${GALILEO_CHAIN_ID.toString()}`
    );
  }

  const wallet = new Wallet(requirePrivateKey(), provider);
  const compiled = await compileContract();
  const existingAddress =
    process.env.ECHO_AGENT_CORE_ADDRESS?.trim() || (await getSavedDeploymentAddress());
  const contract = (existingAddress
    ? new Contract(existingAddress, compiled.abi, wallet)
    : await new ContractFactory(
        compiled.abi,
        `0x${compiled.evm.bytecode.object}`,
        wallet
      ).deploy()) as Contract;

  if (!existingAddress) {
    console.log(`Deploy tx: ${contract.deploymentTransaction()?.hash}`);
    await contract.waitForDeployment();
    console.log(`EchoAgentCore deployed: ${await contract.getAddress()}`);
  } else {
    console.log(`Using existing EchoAgentCore: ${existingAddress}`);
  }

  await registerAgents(contract, wallet.address);

  const contractAddress = await contract.getAddress();
  console.log("\nDeployment complete");
  console.log(`ECHO_AGENT_CORE_ADDRESS=${contractAddress}`);
  console.log(`Explorer: https://chainscan-galileo.0g.ai/address/${contractAddress}`);
}

main().catch((error) => {
  console.error("\nDeploy failed:");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
