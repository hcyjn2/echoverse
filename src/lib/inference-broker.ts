import {
  createZGComputeNetworkBroker,
  createZGComputeNetworkReadOnlyBroker,
  type ServiceWithDetail,
} from "@0glabs/0g-serving-broker";
import { JsonRpcProvider, Wallet } from "ethers";

import { getPrivateKey, getRpcUrl, GALILEO_CHAIN_ID, GALILEO_CHAIN_ID_BIGINT } from "./env.ts";

const DEFAULT_MODEL = "qwen-2.5-7b-instruct";
const DEFAULT_SYSTEM_PROMPT =
  "You are an EchoVerse AI social agent. Reply with one concise, vivid message.";

export type InferenceMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type ChatCompletionResponse = {
  id?: string;
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  usage?: unknown;
};

type BrokerContext = {
  broker: Awaited<ReturnType<typeof createZGComputeNetworkBroker>>;
  endpoint: string;
  model: string;
  provider: string;
};

const brokerContexts = new Map<string, Promise<BrokerContext>>();

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

async function createBrokerContext(targetModel: string): Promise<BrokerContext> {
  const rpcUrl = getRpcUrl();
  const provider = new JsonRpcProvider(rpcUrl);
  const network = await provider.getNetwork();

  if (network.chainId !== GALILEO_CHAIN_ID_BIGINT) {
    throw new Error(
      `RPC is on chain ${network.chainId.toString()}, expected ${GALILEO_CHAIN_ID}`
    );
  }

  const readOnlyBroker = await createZGComputeNetworkReadOnlyBroker(
    rpcUrl,
    GALILEO_CHAIN_ID
  );
  const services = await readOnlyBroker.inference.listServiceWithDetail(0, 50, true);
  const selectedService = selectProvider(services, targetModel);

  if (!selectedService) {
    throw new Error(`No chat provider found for target model: ${targetModel}`);
  }

  const wallet = new Wallet(getPrivateKey(), provider);
  const broker = await createZGComputeNetworkBroker(wallet);

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
    await broker.inference.acknowledgeProviderSigner(selectedService.provider);
  }

  const { endpoint, model } = await broker.inference.getServiceMetadata(
    selectedService.provider
  );

  return {
    broker,
    endpoint,
    model,
    provider: selectedService.provider,
  };
}

async function getBrokerContext(targetModel: string) {
  const key = normalize(targetModel);
  const existing = brokerContexts.get(key);

  if (existing) {
    return existing;
  }

  const created = createBrokerContext(targetModel);
  brokerContexts.set(key, created);
  return created;
}

export async function chatWith0GInference({
  messages,
  model = process.env.INFERENCE_MODEL?.trim() || DEFAULT_MODEL,
  temperature = 0.7,
  maxTokens = 180,
}: {
  messages: InferenceMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
}) {
  const context = await getBrokerContext(model);
  const normalizedMessages =
    messages[0]?.role === "system"
      ? messages
      : [{ role: "system" as const, content: DEFAULT_SYSTEM_PROMPT }, ...messages];
  const requestBody = {
    model: context.model,
    messages: normalizedMessages,
    temperature,
    max_tokens: maxTokens,
  };
  const serializedBody = JSON.stringify(requestBody);
  const headers = await context.broker.inference.getRequestHeaders(
    context.provider,
    serializedBody
  );

  const response = await fetch(`${context.endpoint}/chat/completions`, {
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
    throw new Error(
      `Inference response did not include a reply:\n${JSON.stringify(completion, null, 2)}`
    );
  }

  const chatId = response.headers.get("ZG-Res-Key") || completion.id;
  let verified: boolean | string | null = null;

  if (chatId) {
    verified = await context.broker.inference.processResponse(
      context.provider,
      chatId,
      JSON.stringify(completion.usage ?? {})
    );
  }

  return {
    reply,
    model: context.model,
    provider: context.provider,
    verified,
  };
}
