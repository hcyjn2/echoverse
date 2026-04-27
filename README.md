# EchoVerse

EchoVerse is a Next.js 15 MVP for a 0G Galileo AI social app. Phase 1 is signed off: wallet/onboarding works, 0G Compute returns verified chat responses, and onboarding writes submit to live 0G Storage.

If you are new to Web3: this app uses a normal web frontend plus a server-side testnet wallet. The browser wallet proves the user can connect to 0G Galileo. The server wallet pays for backend testnet actions such as 0G Compute requests and 0G Storage writes.

## Stack

- Next.js 15 App Router
- React 19
- Tailwind CSS 4 + shadcn/ui-style components
- ethers v6
- `@0glabs/0g-serving-broker`
- `@0glabs/0g-ts-sdk`

## Setup

Install dependencies:

```bash
npm install
```

Create local env:

```bash
cp .env.example .env.local
```

Fill in at least:

```env
PRIVATE_KEY=0x_your_64_character_hex_test_wallet_private_key
```

Use a funded 0G Galileo testnet account. Do not commit `.env.local`.

### Private Key Safety

`PRIVATE_KEY` means the private key of a testnet wallet, not the wallet address and not a seed phrase. It should look like 64 hex characters, usually prefixed with `0x`.

Use a dedicated testnet wallet only. Never use a mainnet wallet or a wallet holding real funds. `.env.local` is gitignored; keep it that way.

## Default Env

The app targets 0G Galileo:

```env
RPC_URL=https://evmrpc-testnet.0g.ai
INDEXER_RPC=https://indexer-storage-testnet-turbo.0g.ai
BROKER_NETWORK=testnet
STORAGE_MODE=auto
MIRROR_0G_WRITES_LOCAL=true
```

`STORAGE_MODE=auto` is intentional. Live writes go to 0G Storage, then successful writes are mirrored to `data/local-kv.json` for immediate readback. The public KV RPC endpoint currently times out; see `docs/BACKLOG.md`.

### What These Env Vars Mean

- `RPC_URL`: EVM JSON-RPC endpoint for the 0G Galileo chain. ethers uses this for contract calls, balances, and transactions.
- `INDEXER_RPC`: 0G Storage indexer endpoint. The app asks it which storage nodes should receive uploaded data.
- `KV_RPC`: KV reader endpoint. This is currently unreliable, so the app mirrors successful writes locally.
- `PRIVATE_KEY`: server-side testnet signer. It pays testnet gas/storage fees and signs 0G Compute requests.
- `BROKER_NETWORK`: tells the 0G Compute broker to use testnet.
- `STORAGE_MODE`: `auto`, `0g`, or `local`. Beginners should keep `auto`.
- `MIRROR_0G_WRITES_LOCAL`: when `true`, successful 0G writes are copied to `data/local-kv.json` for immediate readback.

## Web3/0G Concepts

There are three separate 0G surfaces in this repo:

- **0G Chain:** EVM chain used for wallet network checks, contract deployment, and transaction fees.
- **0G Compute:** decentralized inference broker used by `src/lib/inference-broker.ts` and `/api/inference/chat`.
- **0G Storage:** file/KV storage layer used by `src/lib/0g-kv.ts` and `/api/onboarding`.

The frontend wallet and the backend signer are different:

- **Frontend wallet:** MetaMask/Rabby in the browser. Used to prove the user is connected to Galileo.
- **Backend signer:** `PRIVATE_KEY` in `.env.local`. Used by API routes and scripts to pay testnet gas and submit storage/compute requests.

For Phase 1, onboarding is submitted by the backend signer after the user provides a wallet address. This keeps the demo simple and avoids asking the user to sign every storage write.

## Run

Start the dev server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

For wallet testing, use MetaMask or Rabby and approve 0G Galileo:

```text
Chain ID: 16602
RPC: https://evmrpc-testnet.0g.ai
Currency: 0G
Explorer: https://chainscan-galileo.0g.ai
```

## Useful Commands

```bash
npm run lint
npm run build
npm run inference:spike
npm run kv:smoke
npm run kv:smoke:local
```

`npm run kv:smoke` submits a live 0G Storage write in the default auto mode and reads back through the local mirror. `npm run kv:smoke:local` skips 0G and only tests local fallback.

## Manual Browser Test

Use this when checking that the user-facing Phase 1 flow still works:

1. Run `npm run dev`.
2. Open `http://localhost:3000/onboarding`.
3. Click `Connect wallet`.
4. Approve MetaMask/Rabby connection.
5. Approve adding/switching to 0G Galileo if prompted.
6. Select a few tags.
7. Click `Save onboarding`.
8. Confirm the page shows `Saved`.
9. Check the terminal for `POST /api/onboarding 200`.

Good storage logs look like:

```text
Submitting transaction with storage fee: ...
Transaction hash: 0x...
Transaction sequence number: ...
Segments already uploaded and finalized
POST /api/onboarding 200
```

`null response error on attempt 1/3` can appear during segment upload. That is not a failure if it retries and later prints `All tasks processed`.

## API Checks

With the dev server running:

```bash
curl -i -X POST http://localhost:3000/api/inference/chat \
  -H 'Content-Type: application/json' \
  --data '{"messages":[{"role":"user","content":"Reply with one short EchoVerse test message."}]}'
```

```bash
curl -i -X POST http://localhost:3000/api/onboarding \
  -H 'Content-Type: application/json' \
  --data '{"walletAddress":"0x2df7067D85b6FACA30dCf0A3d00b1Cc188443e24","age":"28","gender":"Prefer not to say","tags":["travel","music","crypto"]}'
```

Expected onboarding response includes:

```json
{
  "backend": "0g",
  "mirroredLocal": true
}
```

## Project Map

- `src/app/` - Next.js routes and API routes
- `src/components/` - app shell, wallet UI, shared UI components
- `src/data/agents.ts` - seeded agent personas and asset references
- `src/lib/inference-broker.ts` - 0G Compute broker singleton
- `src/lib/0g-kv.ts` - 0G Storage KV helper with Flow ABI compatibility shim
- `contracts/EchoAgentCore.sol` - Phase 1 contract
- `deployments/` - Galileo deployment metadata
- `scripts/` - smoke/deploy/spike scripts
- `docs/implementation_plan.md` - product implementation plan
- `docs/BACKLOG.md` - known follow-up work

## Current Caveats

- Public 0G KV RPC reads are unavailable at the documented endpoint, so auto mode mirrors successful 0G writes locally.
- The UI is still Phase 1 quality and needs a product design revamp.
- Agent image assets are placeholder SVGs and should be replaced with realistic generated photos.

## Troubleshooting

**`PRIVATE_KEY looks like a wallet address`**

You pasted the public address instead of the private key. Export the private key from a dedicated testnet wallet.

**`PRIVATE_KEY looks like a seed phrase`**

Do not use a seed phrase. Use the single account private key.

**Wallet says wrong network**

Switch MetaMask/Rabby to chain ID `16602`. The app can request the switch, but the wallet user must approve it.

**`execution reverted` during storage submit**

This used to happen because the TS SDK used an old Flow ABI. The repo now includes a compatibility shim in `src/lib/0g-kv.ts`. If this returns, check whether 0G changed the Flow ABI again.

**`KV_RPC` read times out**

Known issue. Keep `STORAGE_MODE=auto` and `MIRROR_0G_WRITES_LOCAL=true`.

**0G Compute request fails**

Run `npm run inference:spike` first. Common causes are an unfunded `PRIVATE_KEY`, wrong `RPC_URL`, or provider/network instability.

## Contribution Flow

Before handing off changes:

```bash
npm run lint
npm run build
```

For changes touching 0G Compute:

```bash
npm run inference:spike
```

For changes touching onboarding or storage:

```bash
npm run kv:smoke
```

Keep unrelated refactors out of feature branches. Check `docs/BACKLOG.md` before starting new Phase 2 work.
