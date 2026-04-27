"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Check, Loader2, Save, Sparkles, TriangleAlert, UserRound, Wallet } from "lucide-react";

import { agents } from "@/data/agents";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const GALILEO_CHAIN_ID = 16602;
const GALILEO_CHAIN_ID_HEX = `0x${GALILEO_CHAIN_ID.toString(16)}`;
const GALILEO_RPC_URL =
  process.env.NEXT_PUBLIC_0G_RPC_URL ?? "https://evmrpc-testnet.0g.ai";
const GALILEO_EXPLORER_URL = "https://chainscan-galileo.0g.ai";

const preferenceTags = [
  "travel",
  "fashion",
  "gaming",
  "fitness",
  "books",
  "crypto",
  "music",
  "food",
];

type EthereumProvider = {
  isMetaMask?: boolean;
  isRabby?: boolean;
  providers?: EthereumProvider[];
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

type WalletError = Error & {
  code?: number;
};

type OnboardingSaveResult = {
  key: string;
  tx: {
    backend?: "0g" | "local";
    txHash?: string;
    rootHash?: string;
    fallbackReason?: string;
    attempts?: number;
  };
};

function getInjectedProvider() {
  if (typeof window === "undefined") {
    return undefined;
  }

  const provider = (window as Window & { ethereum?: EthereumProvider }).ethereum;

  if (!provider?.providers?.length) {
    return provider;
  }

  return (
    provider.providers.find((candidate) => candidate.isRabby) ??
    provider.providers.find((candidate) => candidate.isMetaMask) ??
    provider.providers[0]
  );
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

function formatAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
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

export default function OnboardingPage() {
  const [age, setAge] = useState("28");
  const [gender, setGender] = useState("Prefer not to say");
  const [selectedTags, setSelectedTags] = useState<string[]>(preferenceTags.slice(0, 4));
  const [walletAddress, setWalletAddress] = useState("");
  const [chainId, setChainId] = useState<number | null>(null);
  const [hasProvider, setHasProvider] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveResult, setSaveResult] = useState<OnboardingSaveResult | null>(null);

  const isGalileo = chainId === GALILEO_CHAIN_ID;
  const canSubmit = Boolean(walletAddress && isGalileo && selectedTags.length > 0 && !isSaving);

  const suggestedAgents = useMemo(() => {
    return agents
      .map((agent) => ({
        agent,
        score: agent.interests.filter((interest) => selectedTags.includes(interest)).length,
      }))
      .sort((left, right) => right.score - left.score)
      .slice(0, 4);
  }, [selectedTags]);

  useEffect(() => {
    const provider = getInjectedProvider();
    setHasProvider(Boolean(provider));

    if (!provider) {
      return;
    }

    void Promise.all([
      provider.request({ method: "eth_accounts" }) as Promise<string[]>,
      readChainId(provider),
    ])
      .then(([accounts, currentChainId]) => {
        setWalletAddress(accounts[0] ?? "");
        setChainId(currentChainId);
      })
      .catch(() => {
        setWalletAddress("");
        setChainId(null);
      });
  }, []);

  const connectWallet = async () => {
    const provider = getInjectedProvider();
    setHasProvider(Boolean(provider));

    if (!provider) {
      setError("Install MetaMask or Rabby to save onboarding.");
      return;
    }

    setIsConnecting(true);
    setError(null);
    setSaveResult(null);

    try {
      const accounts = (await provider.request({
        method: "eth_requestAccounts",
      })) as string[];
      await switchToGalileo(provider);

      setWalletAddress(accounts[0] ?? "");
      setChainId(await readChainId(provider));
    } catch (error) {
      const walletError = error as WalletError;
      setError(walletError.message || "Wallet connection failed.");
    } finally {
      setIsConnecting(false);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((currentTags) =>
      currentTags.includes(tag)
        ? currentTags.filter((currentTag) => currentTag !== tag)
        : [...currentTags, tag]
    );
    setSaveResult(null);
  };

  const saveOnboarding = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!walletAddress || !isGalileo) {
      setError("Connect a wallet on 0G Galileo before saving onboarding.");
      return;
    }

    setIsSaving(true);
    setError(null);
    setSaveResult(null);

    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          walletAddress,
          age,
          gender,
          tags: selectedTags,
          suggestedAgentIds: suggestedAgents.map(({ agent }) => agent.id),
        }),
      });
      const result = (await response.json()) as OnboardingSaveResult & {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(result.error || "Onboarding save failed.");
      }

      setSaveResult(result);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Onboarding save failed.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form className="space-y-5" onSubmit={saveOnboarding}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">Onboarding</h1>
          <p className="text-sm text-muted-foreground">
            Save preferences to the 0G KV path with demo fallback.
          </p>
        </div>
        <Badge variant={saveResult ? "default" : "secondary"}>
          {saveResult ? "Saved" : "Ready"}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Wallet className="h-4 w-4" aria-hidden="true" />
            Wallet
          </CardTitle>
          <CardDescription>Galileo is required before preferences can be stored.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="grid gap-1 text-sm">
            <span className="font-medium">
              {walletAddress ? formatAddress(walletAddress) : "No wallet connected"}
            </span>
            <span className="text-muted-foreground">
              {walletAddress && isGalileo
                ? "Connected on 0G Galileo"
                : chainId
                  ? `Wrong network: chain ${chainId}`
                  : hasProvider
                    ? "Wallet available"
                    : "MetaMask or Rabby required"}
            </span>
          </div>
          <Button
            className="w-full sm:w-auto"
            disabled={isConnecting}
            onClick={connectWallet}
            type="button"
          >
            {isConnecting ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Wallet className="h-4 w-4" aria-hidden="true" />
            )}
            {walletAddress ? "Reconnect" : "Connect wallet"}
          </Button>
        </CardContent>
      </Card>

      {error ? (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>{error}</p>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <UserRound className="h-4 w-4" aria-hidden="true" />
                Profile Basics
              </CardTitle>
              <CardDescription>Age and gender inputs for matching.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  inputMode="numeric"
                  onChange={(event) => {
                    setAge(event.target.value);
                    setSaveResult(null);
                  }}
                  value={age}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Input
                  id="gender"
                  onChange={(event) => {
                    setGender(event.target.value);
                    setSaveResult(null);
                  }}
                  value={gender}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                Preferences
              </CardTitle>
              <CardDescription>Seed tags used to rank agent suggestions.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {preferenceTags.map((tag) => {
                const selected = selectedTags.includes(tag);

                return (
                  <Button
                    aria-pressed={selected}
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    type="button"
                    variant={selected ? "default" : "outline"}
                    size="sm"
                  >
                    {selected ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : null}
                    {tag}
                  </Button>
                );
              })}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Suggested Agents</CardTitle>
            <CardDescription>Matched from selected onboarding tags.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {suggestedAgents.map(({ agent, score }) => (
              <div key={agent.id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{agent.displayName}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {agent.interests.join(" / ")}
                    </p>
                  </div>
                  <Badge variant="outline">{score} match</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm">
            <p className="font-medium">
              {saveResult
                ? `Stored via ${saveResult.tx.backend ?? "0g"}`
                : "Preferences are ready to save."}
            </p>
            <p className="text-muted-foreground">
              {saveResult?.tx.fallbackReason
                ? "0G write fell back locally after a storage error."
                : saveResult?.key ?? "Connect wallet, then save."}
            </p>
          </div>
          <Button className="w-full sm:w-auto" disabled={!canSubmit} type="submit">
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Save className="h-4 w-4" aria-hidden="true" />
            )}
            Save onboarding
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
