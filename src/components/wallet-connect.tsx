"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BrowserProvider } from "ethers";
import { CheckCircle2, ExternalLink, Loader2, TriangleAlert, Wallet } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const GALILEO_CHAIN_ID = 16602;
const GALILEO_CHAIN_ID_HEX = `0x${GALILEO_CHAIN_ID.toString(16)}`;
const GALILEO_RPC_URL =
  process.env.NEXT_PUBLIC_0G_RPC_URL ?? "https://evmrpc-testnet.0g.ai";
const GALILEO_EXPLORER_URL = "https://chainscan-galileo.0g.ai";

type EthereumProvider = {
  isMetaMask?: boolean;
  isRabby?: boolean;
  providers?: EthereumProvider[];
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
};

type WalletError = Error & {
  code?: number;
};

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

function getInjectedProvider() {
  if (typeof window === "undefined") {
    return undefined;
  }

  const provider = window.ethereum;

  if (!provider?.providers?.length) {
    return provider;
  }

  return (
    provider.providers.find((candidate) => candidate.isRabby) ??
    provider.providers.find((candidate) => candidate.isMetaMask) ??
    provider.providers[0]
  );
}

function formatAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function parseChainId(value: unknown) {
  if (typeof value === "string") {
    return Number.parseInt(value, value.startsWith("0x") ? 16 : 10);
  }

  if (typeof value === "number") {
    return value;
  }

  return null;
}

async function readChainId(provider: EthereumProvider) {
  return parseChainId(await provider.request({ method: "eth_chainId" }));
}

async function switchToGalileo(provider: EthereumProvider) {
  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: GALILEO_CHAIN_ID_HEX }],
    });
  } catch (error) {
    const walletError = error as WalletError;

    if (walletError.code !== 4902) {
      throw walletError;
    }

    await provider.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: GALILEO_CHAIN_ID_HEX,
          chainName: "0G Galileo Testnet",
          nativeCurrency: {
            name: "0G",
            symbol: "0G",
            decimals: 18,
          },
          rpcUrls: [GALILEO_RPC_URL],
          blockExplorerUrls: [GALILEO_EXPLORER_URL],
        },
      ],
    });
  }
}

export function WalletConnect() {
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [hasProvider, setHasProvider] = useState(false);

  const isGalileo = chainId === GALILEO_CHAIN_ID;
  const statusLabel = useMemo(() => {
    if (!hasProvider) {
      return "No wallet";
    }

    if (!account) {
      return "Disconnected";
    }

    return isGalileo ? "Connected" : "Wrong network";
  }, [account, hasProvider, isGalileo]);

  const refreshWalletState = useCallback(async () => {
    const provider = getInjectedProvider();
    setHasProvider(Boolean(provider));

    if (!provider) {
      setAccount(null);
      setChainId(null);
      return;
    }

    const [accounts, currentChainId] = await Promise.all([
      provider.request({ method: "eth_accounts" }) as Promise<string[]>,
      readChainId(provider),
    ]);

    setAccount(accounts[0] ?? null);
    setChainId(currentChainId);
  }, []);

  useEffect(() => {
    void refreshWalletState();

    const provider = getInjectedProvider();
    if (!provider?.on) {
      return;
    }

    const handleAccountsChanged = (...args: unknown[]) => {
      const accounts = args[0] as string[] | undefined;
      setAccount(accounts?.[0] ?? null);
      setError(null);
    };

    const handleChainChanged = (...args: unknown[]) => {
      setChainId(parseChainId(args[0]));
      setError(null);
    };

    provider.on("accountsChanged", handleAccountsChanged);
    provider.on("chainChanged", handleChainChanged);

    return () => {
      provider.removeListener?.("accountsChanged", handleAccountsChanged);
      provider.removeListener?.("chainChanged", handleChainChanged);
    };
  }, [refreshWalletState]);

  const connectWallet = async () => {
    const provider = getInjectedProvider();

    if (!provider) {
      setError("Install MetaMask or Rabby to connect a wallet.");
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      await provider.request({ method: "eth_requestAccounts" });

      const ethersProvider = new BrowserProvider(provider);
      const signer = await ethersProvider.getSigner();
      const address = await signer.getAddress();
      const currentChainId = await readChainId(provider);

      setAccount(address);
      setChainId(currentChainId);

      if (currentChainId !== GALILEO_CHAIN_ID) {
        await switchNetwork();
      }
    } catch (error) {
      const walletError = error as WalletError;
      setError(walletError.message || "Wallet connection failed.");
    } finally {
      setIsConnecting(false);
    }
  };

  const switchNetwork = async () => {
    const provider = getInjectedProvider();

    if (!provider) {
      setError("Install MetaMask or Rabby to switch networks.");
      return;
    }

    setIsSwitching(true);
    setError(null);

    try {
      await switchToGalileo(provider);
      setChainId(await readChainId(provider));
    } catch (error) {
      const walletError = error as WalletError;
      setError(walletError.message || "Could not switch to 0G Galileo.");
    } finally {
      setIsSwitching(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">Wallet Access</CardTitle>
            <CardDescription>
              Connect MetaMask or Rabby and stay on 0G Galileo testnet.
            </CardDescription>
          </div>
          <Badge variant={account && isGalileo ? "default" : "secondary"}>
            {statusLabel}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border bg-muted/40 p-3">
            <p className="text-xs font-medium uppercase text-muted-foreground">
              Wallet
            </p>
            <p className="mt-1 text-sm font-medium">
              {account ? formatAddress(account) : "Not connected"}
            </p>
          </div>
          <div className="rounded-lg border bg-muted/40 p-3">
            <p className="text-xs font-medium uppercase text-muted-foreground">
              Network
            </p>
            <p className="mt-1 text-sm font-medium">
              {chainId ? `Chain ID ${chainId}` : "Unknown"}
            </p>
          </div>
        </div>

        {error ? (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <p>{error}</p>
          </div>
        ) : null}

        {account && isGalileo ? (
          <div className="flex items-center gap-2 rounded-lg border bg-muted/40 p-3 text-sm">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
            Ready for 0G Chain transactions.
          </div>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            className="w-full sm:w-auto"
            disabled={isConnecting}
            onClick={connectWallet}
          >
            {isConnecting ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Wallet className="h-4 w-4" aria-hidden="true" />
            )}
            {account ? "Reconnect wallet" : "Connect wallet"}
          </Button>

          <Button
            className="w-full sm:w-auto"
            disabled={!hasProvider || isSwitching || isGalileo}
            onClick={switchNetwork}
            variant="outline"
          >
            {isSwitching ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : null}
            Switch to Galileo
          </Button>

          <Button className="w-full sm:w-auto" variant="ghost" asChild>
            <a href={GALILEO_EXPLORER_URL} target="_blank" rel="noreferrer">
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              Explorer
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
