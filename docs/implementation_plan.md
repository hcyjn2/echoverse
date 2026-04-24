# Team Availability

- **Coder A:** 2 hrs weekdays + 3 hrs weekends
- **Coder B:** 1 hr weekdays + 3 hrs weekends
- **Coder C:** 2 hrs weekdays + 3 hrs weekends
- **Advisor:** Weekends only, Phase 2 onward

> Weekends are reserved for high-risk integration tasks: broker, contract, merge.

---

# Implementation Plan

## Checkbox Legend

- [ ] **TASK:** Work to build or implement.
- [ ] **TEST:** Verification, validation, review, or demo check.
- Plain bullets: Notes, deliverables, context, lists, or non-action reference items.

---

# Phase 1: Backbone + 0G Inference Spike

**Timeline:** Days 1–5  
**Goal:** Wallet auth works. A chat completion returns from 0G Compute testnet. Stubbed feed is visible.

## Day 1

- [ ] **TASK — Coder A:** Scaffold Next.js 15 + Tailwind + shadcn/ui + ethers v6. Install `@0glabs/0g-serving-broker` and `@0glabs/0g-ts-sdk`.
  - **Deliverable:** Dev repo running.

- [ ] **TASK — Coder B:** Create shared 0G testnet wallet. Claim faucet. Document env vars:
  - `PRIVATE_KEY`
  - `RPC_URL`
  - `INDEXER_RPC`
  - `BROKER_NETWORK=testnet`
  - **Deliverable:** `.env.local` template.

- [ ] **TASK — Coder C:** Generate 6 agent personas + 12 visual assets, including avatars and story images, with AI image tools.
  - **Deliverable:** `/public/assets/` populated.

## Day 2

- [ ] **TASK — Coder A:** Build WalletConnect component using MetaMask/Rabby, forcing 0G Galileo Chain ID `16602`.
  - **Deliverable:** Wallet button + network guard.

- [ ] **TASK — Coder B:** Draft `EchoAgentCore.sol`:
  - `registerAgent`
  - `tipAgent`
  - `unlockVIP`
  - `isVIP`
  - Keep it minimal.
  - **Deliverable:** Solidity file ready.

- [ ] **TASK — Coder C:** Build app shell layout:
  - Home
  - Search
  - Post
  - Chat
  - Profile
  - Blank page stubs
  - **Deliverable:** Navigable UI skeleton.

## Day 3

- [ ] **TASK — Coder A:** 0G Inference Spike. Create standalone script using `createZGComputeNetworkBroker` to:
  - Discover `qwen-2.5-7b-instruct` provider
  - Acknowledge signer
  - Return a chat completion
  - **Deliverable:** `scripts/inference-spike.ts` prints an LLM response.

- [ ] **TASK — Coder B:** Deploy `EchoAgentCore.sol` to Galileo. Seed 6 agents:
  - Wallet
  - Metadata key
  - Name
  - Tags
  - **Deliverable:** Verified contract on explorer.

- [ ] **TASK — Coder C:** Build static Onboarding UI:
  - Preferences
  - Age/gender
  - Tags
  - **Deliverable:** Onboarding screens.

## Day 4

- [ ] **TASK — Coder A:** Wrap the spike into `lib/inference-broker.ts` as a singleton broker. Build `POST /api/inference/chat` route:
  - Accepts `{messages, model?}`
  - Returns `{reply}`
  - **Deliverable:** Backend LLM proxy working.

- [ ] **TASK — Coder B + Coder A:** Write `lib/0g-kv.ts` server helper:
  - `writeKV(key, value)`
  - `readKV(key)`
  - Use fixed `streamId`
  - Test write onboarding data
  - **Deliverable:** KV wrapper proven.

- [ ] **TASK — Coder C:** Stub home feed + story carousel using hardcoded agent JSON.
  - **Deliverable:** Feed renders.

## Day 5 — Weekend

- [ ] **TASK — All:** Integration checkpoint:
  - [ ] **TEST — Coder A:** Test wallet → onboarding → KV write → broker chat.
  - [ ] **TEST — Coder B:** Verify contract TXs on explorer.
  - [ ] **TASK — Coder C:** Polish nav states.
  - [ ] **TEST — Advisor:** Review repo structure and security.
  - [ ] **TEST — All:** Confirm no leaked keys.
  - **Deliverable:** Backbone signed off.

## Phase 1 Success Gate

- [ ] **TEST:** User can connect wallet.
- [ ] **TEST:** User can finish onboarding.
- [ ] **TEST:** User can hit `/api/inference/chat`.
- [ ] **TEST:** User receives a response from 0G Compute testnet.

---

# Phase 2: Parallel Feature Plans

**Timeline:** Days 6–11

---

## Plan A: Agent Chat Engine & 0G Inference Proxy

**Owner:** Coder A  
**Description:** 1-on-1 DM system powered entirely by 0G Compute testnet. Each agent uses a distinct system prompt. Chat history, using the last 5 exchanges, is stored in 0G Storage KV.

### Requirements

- [ ] **TASK:** Build Chat UI with WhatsApp-style bubbles per agent.
- [ ] **TASK:** Build `POST /api/chat/:agentId`.
- [ ] **TASK:** Import `lib/inference-broker.ts`.
- [ ] **TASK:** Fetch agent persona from KV/contract.
- [ ] **TASK:** Build message array:
  - `system`
  - `...history`
  - `user`
- [ ] **TASK:** Call 0G Compute.
- [ ] **TASK:** Store memory in 0G Storage KV:
  - Key: `chat:{userWallet}:{agentId}`
  - Value: JSON array
  - Keep last 5 turns.
- [ ] **TASK:** Add VIP check:
  - Call `EchoAgentCore.isVIP(user, agentId)`
  - If true, reply in under 1 second.
  - If false, delay 1.5–3 seconds.
- [ ] **TASK:** Support emojis natively through `qwen-2.5-7b`.

### 0G Integration

- [ ] **TASK:** Use 0G Compute Network with `qwen-2.5-7b-instruct` through broker singleton.
- [ ] **TASK:** Use 0G Storage KV for `chat:{wallet}:{agentId}` message history.
- [ ] **TASK:** Use 0G Chain to read `isVIP` from deployed contract.

### Timeline

**Day 6:** Finalize `lib/inference-broker.ts` singleton and handle provider discovery caching.  
**Day 7–8:** Build chat UI + API route and wire system prompts for 6 agents.  
**Day 9:** Integrate KV read/write for memory.  
**Day 10:** Add VIP gating + delay logic, chat list, and unread badges.  
**Day 11:** Hook into Plan C so when user posts a story, an agent comment is auto-triggered via chat route.

---

## Plan B: On-Chain Economy, Agent Registry & KV Backend

**Owner:** Coder B  
**Note:** Weekend deep-work recommended.  
**Description:** All blockchain and storage wiring. Because Coder B has only 1 hr on weekdays, this plan front-loads logic into weekends.

### Requirements

- [ ] **TASK:** Deploy and verify `EchoAgentCore.sol` on Galileo.
- [ ] **TASK:** Build robust `lib/0g-kv.ts` wrapper with retry logic.
- [ ] **TASK:** Add fallback to local JSON if KV is down for demo resilience.
- [ ] **TASK:** Build `POST /api/pay/tip`.
  - Calls `tipAgent(agentId)` or direct transfer.
  - Returns TX hash.
- [ ] **TASK:** Build `POST /api/pay/vip`.
  - Calls `unlockVIP(agentId)` payable.
  - Returns TX hash.
- [ ] **TASK:** Build `GET /api/agent/:id/profile`.
  - Reads on-chain metadata.
  - Reads KV metadata blob.
- [ ] **TASK:** Build `GET /api/user/vip-status`.
  - Reads `isVIP(user, agentId)` across followed agents.

### 0G Integration

- [ ] **TASK:** Use 0G Chain for contract deployment and all payment reads/writes.
- [ ] **TASK:** Use 0G Storage KV for:
  - Profile metadata
  - User preferences
  - Story metadata

### Timeline

**Day 6 — Weekend:** Finalize/deploy contract. Seed agent registry with 6 agents.  
**Day 7–8 — Weekdays, light:** Polish KV wrapper and add error handling.  
**Day 9 — Weekend:** Build `/api/pay/*` routes using ethers server-side signer.  
**Day 10:** Build profile + VIP status endpoints.  
**Day 11:** Support Plan A by exposing VIP endpoint. Support Plan C by exposing agent list endpoint.

---

## Plan C: Social Feed, Stories & Content Frontend

**Owner:** Coder C  
**Description:** Every consumer-facing screen except chat. Coder C must stay within shadcn/ui + Tailwind to compensate for taste gaps.

### Requirements

- [ ] **TASK:** Wire onboarding UI to `POST /api/user/prefs`.
- [ ] **TASK:** Write onboarding prefs to KV.
- [ ] **TASK:** Block onboarding progress until wallet is connected.
- [ ] **TASK:** Build Home Feed:
  - Stories carousel at top
  - Vertical post feed
  - Static seed JSON initially
  - Swap later to `GET /api/feed`
- [ ] **TASK:** Build Story Viewer:
  - Full-screen image viewer
  - Mark seen after 3 seconds.
- [ ] **TASK:** Build User Story Creation:
  - Image upload on client
  - Caption input
  - API writes metadata to KV
  - Upload one image file to 0G Storage using API route with `Indexer.upload`
  - Store `rootHash` in metadata.
- [ ] **TASK:** Build Agent Profile:
  - Free feed
  - Blurred VIP section
  - Read VIP status from Plan B endpoint.
- [ ] **TASK:** Build Comments:
  - Comment input under posts
  - On submit, call `POST /api/comment`
  - Route hits Plan A inference route with comment-reply system prompt.
- [ ] **TASK:** Build Suggested Agents:
  - Rule-based list comparing user onboarding tags to agent tags.

### 0G Integration

- [ ] **TASK:** Use 0G Storage KV for:
  - Onboarding prefs
  - Story metadata
  - Comments
- [ ] **TASK:** Use 0G Storage File for one user story image upload to prove binary storage capability.
- [ ] **TASK:** Use 0G Chain by calling `/api/pay/*` from Unlock/Gift buttons.

### Timeline

**Day 6–7:** Wire onboarding to real API. Build feed + story carousel.  
**Day 8:** Build story viewer + user story creation flow.  
**Day 9–10:** Build agent profile, free/VIP tabs, comments, and payment buttons.  
**Day 11:** Build suggested agents + UI polish.

---

# Phase 3: Merge, Harden & Demo

**Timeline:** Days 12–14

## Day 12 — Weekend

- [ ] **TASK — All:** Merge Plan A/B/C branches into `main`.
- [ ] **TASK — All:** Resolve API route conflicts first.
- [ ] **TEST — Advisor:** Code review:
  - [ ] **TEST:** Ensure `PRIVATE_KEY` is server-only.
  - [ ] **TEST:** Ensure 0G broker uses singleton pattern correctly.
  - [ ] **TEST:** Verify no provider funding leaks.

## Day 13

- [ ] **TEST — Coder A + Coder C:** Golden Path Hardening. Run demo script 5 times:
  - [ ] **TEST:** Onboard.
  - [ ] **TEST:** View Story.
  - [ ] **TEST:** Comment.
  - [ ] **TEST:** Chat with 0G Compute reply.
  - [ ] **TEST:** Unlock VIP.
  - [ ] **TEST:** Gift.
  - [ ] **TASK:** Fix crashes.

- [ ] **TASK — Coder B:** Add “View on 0G Explorer” links next to every on-chain TX and KV write.
- [ ] **TASK — Coder B:** Ensure TX hashes are visible in UI.

## Day 14 — Weekend

- [ ] **TASK — Coder C:** Final UI pass:
  - [ ] **TASK:** Loading skeletons.
  - [ ] **TASK:** Error toasts.
  - [ ] **TASK:** Empty states.

- [ ] **TASK — Coder A:** Deploy to Vercel.
- [ ] **TEST — Coder A:** Test from fresh browser + fresh wallet.
- [ ] **TASK — All:** Record 2–3 minute demo video.

---

# Risk Notes

1. 0G Inference Broker Complexity: The first time setup — deposit → acknowledge provider → get session token — is finicky. The Day 3 spike is non-negotiable. If the broker fails after 2 hours of debugging, fallback is OpenAI proxy for chat but keep 0G Storage + Chain as primary. Do not let inference block the entire build.

2. Coder B Time Crunch: B owns contract + KV. If weekdays are too fragmented, B should do all contract work on Day 6/9 weekends when 3-hour blocks are available.

3. 0G Serving Broker in Next.js: Run the broker only inside API routes using Node.js. Never in the browser. Use a singleton pattern to avoid re-initializing the broker on every request.

4. Testnet Token Faucet: If the faucet is empty/slow, the inference spike dies immediately. Claim test tokens on Day 1 and keep a backup wallet funded.

---

# 0G Service Map

| Feature | 0G Service | Model / Tool | Why |
|---|---|---|---|
| Agent LLM | 0G Compute Inference testnet | `qwen-2.5-7b-instruct` | OpenAI-compatible, auto-fund in Node.js, proves Compute usage |
| Story/Chat/Profile Metadata | 0G Storage KV | `@0glabs/0g-ts-sdk` | Decentralized social graph data |
| User Story File | 0G Storage File | `Indexer.upload` | Proves file storage capability |
| Agent Identity & Payments | 0G Chain Galileo | `EchoAgentCore.sol` | Agent registry + VIP/tipping logic |
| Wallet Auth | 0G Chain Galileo | ethers + MetaMask | Required hackathon infra |