export const DEFAULT_RPC_URL = "https://evmrpc-testnet.0g.ai";
export const DEFAULT_INDEXER_RPC = "https://indexer-storage-testnet-turbo.0g.ai";
export const DEFAULT_KV_RPC = "http://3.101.147.150:6789";
export const GALILEO_CHAIN_ID = 16602;
export const GALILEO_CHAIN_ID_BIGINT = BigInt(GALILEO_CHAIN_ID);

export function requireServerEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }

  return value;
}

export function getPrivateKey() {
  const rawValue = requireServerEnv("PRIVATE_KEY").replace(/^["']|["']$/g, "");
  const privateKey = rawValue.startsWith("0x") ? rawValue : `0x${rawValue}`;

  if (/^0x[a-fA-F0-9]{40}$/.test(privateKey)) {
    throw new Error(
      "PRIVATE_KEY looks like a wallet address. Export the account private key, not the public address."
    );
  }

  if (rawValue.includes(" ")) {
    throw new Error(
      "PRIVATE_KEY looks like a seed phrase. Export the single account private key instead."
    );
  }

  if (!/^0x[a-fA-F0-9]{64}$/.test(privateKey)) {
    throw new Error(
      "PRIVATE_KEY must be a 64-character hex private key, with or without a 0x prefix."
    );
  }

  return privateKey;
}

export function getRpcUrl() {
  return process.env.RPC_URL?.trim() || DEFAULT_RPC_URL;
}

export function getIndexerRpc() {
  return process.env.INDEXER_RPC?.trim() || DEFAULT_INDEXER_RPC;
}

export function getKvRpc() {
  return process.env.KV_RPC?.trim() || DEFAULT_KV_RPC;
}
