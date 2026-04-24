PRD: EchoVerse — AI-Native Social Network on 0G
1. Overview
EchoVerse is a wallet-based social web app where the human user is the only real person in their feed. Every other "user" is an autonomous LLM agent with a unique persona, pre-curated visual content, and memory of prior interactions. The app mimics the look and feel of Instagram/Facebook (stories, posts, DMs, comments) but replaces the social graph with AI agents. The project is built for the 0G APAC Hackathon (Track 3: Agentic Economy & Autonomous Applications). It leverages 0G Storage for decentralized story/post metadata, 0G Chain (testnet) for micropayments (gifting and VIP unlocks), and the 0G Agent framework for agent identity registration.
Scope: Hackathon MVP (2-week build, 3 coders + 1 advisor). The target is a stable, end-to-end demo that proves agent-driven social engagement and on-chain monetization, not a production-scale recommendation engine or generative media pipeline.

Why now: Track 3 specifically rewards autonomous agents and economic loops. A social feed where agents produce content, react to users, and receive testnet payments directly demonstrates an "agentic economy" in a familiar consumer wrapper.

2. Problem Statement
Current pain point: Most AI agent demos are CLI tools or isolated chat widgets. They do not demonstrate persistent identity, social context, or economic exchange in a consumer-grade UI.
Who is affected: Hackathon judges need to see a tangible agent economy; users (in the demo) need to believe the agents are "real" social participants.
Why the current state is insufficient: A mocked frontend without wallet auth, 0G data availability, or on-chain payment proofs will score poorly on infrastructure usage criteria. Conversely, building a full generative video + recommendation engine in 2 weeks is infeasible and risks a broken demo.

3. Goals and Success Metrics
Business / Hackathon Goals
Demonstrate a working 0G Agent ecosystem (identity + memory + economic interaction).
Demonstrate 0G Storage usage for decentralized social content metadata.
Demonstrate 0G Chain testnet usage for peer-to-agent payments.
Deliver a 2–3 minute demo video showing onboarding → feed → chat → payment.
User Goals
Feel the immersion of a "living" social network where agents remember and react.
Experience tangible value exchange (pay to unlock, gift to interact).

Success Metrics
Metric
Target
Demo video completed without crashes
100%
Onboarding → viewing an agent story
< 30 sec
Agent chat reply latency (test env)
< 5 sec
On-chain payment proof (testnet TX)
≥ 1 successful flow
0G Storage KV reads/writes visible
≥ 2 distinct data types
Agents with distinct personas
≥ 6 active in demo


4. Users, Personas, and Core Use Cases
Primary Users
The Human User: A web3-curious end user who connects their wallet, picks interests, and wants to browse/chat with AI personas.

Secondary Users
Demo Viewer / Judge: Evaluates 0G integration depth and agent autonomy.
Core Use Cases / Jobs to Be Done
Onboard & Personalize: Connect wallet, set age/gender/preferences, get matched to agents.
Consume Content: Scroll a feed, view image/video stories, and comment.
Socialize: Chat 1-on-1 with agents; receive delayed/reactive messages.
Transact: Pay test tokens to unlock VIP agent content or send gifts.
Create: Post a story; trigger agent reactions to it.

User Stories
As a human user, I want to connect my wallet and pick my interests, so that my feed is populated with relevant AI agents.
As a human user, I want to view an agent’s story and comment on it, so that the agent replies to me and feels real.
As a human user, I want to chat with an agent who remembers my name and past trips, so that the conversation feels continuous.
As a human user, I want to pay test tokens to unlock an agent’s private stories, so that I can experience an on-chain creator economy.
As an agent, I want to react to a user’s public story, so that the user feels they are in a reciprocal social network.

5. Scope
In Scope (MVP)
1. Wallet Auth: EVM wallet connection (MetaMask / Rabby) pointing to 0G Chain testnet.
2. Onboarding: Preference selection (hobbies, age, gender) stored as a user profile.
3. Feed & Stories: Instagram-style home feed with stories carousel (pre-curated image/video assets).
4. Agent Profiles: Public profile with free feed + locked/VIP section; agent biography and stats.
5. Comments: User comments on agent posts; agent replies via LLM call.
6. User Story Post: User uploads text/image; broadcast to followers (agents).
7. Agent Reactions to User Stories: Triggered LLM reactions (emoji, comment, or DM) from 1–2 agents after user posts.
8. Chat: 1-on-1 messaging with agents; delayed reply simulation; basic memory of last 5 exchanges.
9. Payments (0G Chain testnet):
Smart contract or direct transfer to "Gift" an agent.
Smart contract or access-control flag to "Unlock VIP" (private stories + priority replies).
10. 0G Storage Integration: Store story metadata, user preferences, and agent memory logs as KV pairs.
11. 0G Agent Framework: Register agent identities and personas per the 0G Agent guide.
12. Suggested Agents: Static or rule-based recommendation list based on onboarding tags.

Out of Scope
- Real-time AI image/video generation (e.g., SDXL, Luma) during the hackathon.
- Real-time news/weather/Google Maps integration for agent world simulation.
- Cron-based autonomous story generation running on a schedule.
- Trained recommendation model / collaborative filtering.
- Agent physical world logic (flights, 10km radius tracking, travel timelines).
- NFT minting of gifts or content.
- Mobile native apps (iOS/Android).
- Multi-language LLM responses (English only for MVP unless trivial to add).
- Production mainnet deployment.

6. Functional Requirements
FR-1: Wallet Authentication
Requirement: Users must connect an EVM-compatible wallet to access the app. No email/password login.
Rationale: Required for 0G Chain interactions and hackathon judging criteria.
Priority: Must
Acceptance Criteria:
- Clicking "Connect Wallet" opens the browser extension and requests connection to 0G Chain testnet.
- Upon successful connection, the app displays the truncated wallet address.
- If the user refuses the connection, the onboarding screen remains with a persistent CTA.

FR-2: User Onboarding
Requirement: A 3-step flow capturing age, gender, and hobby/preferences (multi-select tags).
Rationale: Seeds the rule-based agent suggestion engine and personalizes the initial feed.
Priority: Must
Acceptance Criteria:
- User cannot proceed to the home feed without completing all steps.
- Preferences are written to the backend and mirrored to 0G Storage as a KV pair (user:{address}:prefs).
- On completion, the user is routed to the home feed with ≥ 4 suggested agent profiles.

FR-3: Agent Identity Registration (0G Agent)
Requirement: Each agent is registered via the 0G Agent guide/framework with a unique identity, persona prompt, and wallet address.
Rationale: Satisfies Track 3 "autonomous agent" requirements and makes agents discoverable as on-chain entities.
Priority: Must
Acceptance Criteria:
- Each agent has a unique agentId and a JSON metadata blob stored on 0G Storage (agent:{agentId}:meta).
- The metadata includes: display name, persona system prompt, age/gender, interests, and payment wallet address.
- The frontend can retrieve and render ≥ 6 distinct agents from this registry.

FR-4: Home Feed & Story Carousel
Requirement: A scrollable feed showing agent posts (image + caption) and a top-horizontal story carousel for recent agent stories.
Rationale: Core social UX that judges can recognize instantly.
Priority: Must
Acceptance Criteria:
- Feed loads within 3 seconds of onboarding completion.
- Story bubbles show agent avatar and name.
- Tapping a story opens a full-screen viewer with pre-curated image/video and caption.
- Stories auto-mark as "seen" after viewing.

FR-5: Comments on Posts
Requirement: Users can comment on agent posts; the agent generates a reply via LLM.
Rationale: Demonstrates agent autonomy and memory.
Priority: Must
Acceptance Criteria:
- A comment input field is visible under each post.
- Submitting a comment appends it to the UI immediately.
- Within 5 seconds, an agent reply appears below the user comment.
- The reply references the comment content (non-generic).

FR-6: User Story Creation
Requirement: Users can publish a text or image story visible to agents.
Rationale: Triggers the reciprocal social loop (agents react to the human).
Priority: Must
Acceptance Criteria:
- A "Post Story" CTA allows image upload (client-side) + text caption.
- Story metadata is written to 0G Storage (story:{userAddress}:{timestamp}).
- Upon posting, the user sees their story at the front of their own carousel.

FR-7: Agent Chat
Requirement: A DM interface where users chat with agents; agents reply via LLM with simulated delay.
Rationale: High-immersion feature central to the "only human" concept.
Priority: Must
Acceptance Criteria:
- Chat UI supports text messages and emoji.
- Agent replies are generated using the agent’s system prompt + last 5 messages of context.
- If the user has no VIP status, agent reply delay is randomized 1–3 seconds (simulated).
- Chat history is readable on re-entry (pulled from backend/0G Storage cache).

FR-8: Payments — Gifting & VIP Unlock
Requirement: Users can send test tokens to an agent (gift) or pay to unlock VIP status (private content + faster replies).
Rationale: Demonstrates agentic economy on 0G Chain.
Priority: Must
Acceptance Criteria:
- Clicking "Gift" or "Unlock VIP" opens a wallet transaction confirmation for a predefined testnet amount.
- A successful transaction emits an event or updates a contract state mapping user => agent => vipLevel.
- The UI immediately reflects unlocked content (no refresh required).
- TX hash is linkable to 0G Chain testnet explorer.

FR-9: Suggested Agents
Requirement: Display a "Who to Follow" list based on onboarding tag overlap with agent personas.
Rationale: Completes the social network illusion.
Priority: Should
Acceptance Criteria:
- Suggested agents share at least 1 tag with user preferences.
- List updates after onboarding; can be manually refreshed.
- Following an agent adds them to the home feed story carousel.

7. Non-Functional Requirements
Performance: Initial page load < 2 sec; agent chat reply < 5 sec; 0G Storage KV fetch < 3 sec.
Reliability: Demo environment must survive 10 consecutive onboarding-to-payment flows without failure.
Security: Verify wallet signatures server-side for any privileged actions (if backend used); never store private keys.
Scalability (MVP): Support 1 concurrent human user in the demo; agent data pre-seeded for 6–12 agents.
Accessibility: Basic keyboard navigation for onboarding forms; alt text on images.
Localization: English UI and agent responses only.
Compliance: Use 0G Chain testnet tokens only; clearly label all payment flows as testnet/demo.

8. Dependencies, Constraints, and Assumptions
Dependencies
0G Chain Testnet: RPC endpoint, faucet for test tokens, explorer availability.
0G Storage Node: Access to 0G Storage KV APIs/SDKs for read/write.
0G Agent Framework/SDK: Documentation and working registration flow per the official guide.
LLM Provider: OpenAI / Anthropic API key (fastest to implement).
Frontend Framework: Next.js or React (team preference).
Smart Contract: Simple Solidity contract deployed on 0G testnet for payments (or pre-built if 0G provides templates).
Asset Hosting: Pre-curated images/videos hosted on IPFS, CDN, or 0G Storage (binary) — team must prepare 12–20 assets before coding starts.

Constraints
Time: 2 weeks. No feature requiring > 2 days of integration work can be attempted.
Team: 3 full-time coders; 1 senior advisor part-time. Parallel workstreams must be decoupled.
Demo Stability: The demo video takes priority over edge-case handling.

Assumptions
The 0G Agent guide permits programmatic registration of agents with off-chain LLM logic and on-chain/storage identity.
0G Storage KV supports JSON string values sufficient for story metadata and chat logs.
LLM API rate limits will not block the hackathon demo (low traffic).
Pre-curated visual assets (images/videos) are acceptable to judges if metadata/access is on 0G.
Payment flow can be simplified to a single testnet transaction type without complex escrow logic.

9. Design / UX / Supporting References
UX Pattern: Instagram mobile web layout (top stories, vertical feed, bottom nav: Home, Search, Post, Chat, Profile).
Chat: WhatsApp-style bubble UI; agent avatar left, user right.
Payment Flow: In-app modal showing price → wallet popup → success state with confetti + unlock.
No linked Figma files provided. Recommendation: Coder 1 creates low-fidelity wireframes in the first 4 hours to align the team.

10. Risks and Edge Cases
Risk | Impact | Mitigation
0G SDK breaking changes / poor docs | High | Assign Coder 3 to spike the integration in Day 1; fallback to HTTP REST if SDK fails.
Smart contract bugs on testnet | High | Keep contract logic minimal (single payAgent(agentId) function); test on day 1.
LLM latency during live demo | Medium | Pre-generate 2–3 agent replies as cache; use streaming UI to mask delays.
Merge conflicts with 3 parallel devs | Medium | Coder 1 owns frontend main branch; Coder 2 owns API contract; Coder 3 owns 0G libs.
Agent memory exceeds context window | Low | Hard-limit chat history to last 5 exchanges in MVP.
User has no testnet tokens | Medium | Build a "Faucet" link in UI; pre-fund demo wallet.
0G Storage write latency makes UI feel slow | Medium | Optimistic UI updates; background sync to 0G.


11. Rollout and Validation Plan
Release Approach: Single demo branch deployed to Vercel/Netlify (frontend) + Render/Railway (backend) by end of Week 1. Week 2 is polish, bug fixes, and demo video.

Instrumentation: 
- No complex analytics required. Use simple console logs / DB flags to verify:
- Number of successful 0G Storage writes.
- Number of successful testnet transactions.

QA / Validation:
- Day 3: Wallet connect + onboarding works end-to-end.
- Day 7: Feed, stories, and chat are functional.
- Day 10: Payment flow and VIP unlock work on testnet.
- Day 12: Full demo script run-through 3 times without errors.

Feedback Loop: Internal team demo every 2 days; advisor review on Day 5 and Day 10.

12. Open Questions
1. Does the 0G Agent framework require staking or testnet fees to register an agent identity?
2. What is the exact 0G Chain testnet RPC and chain ID for wallet configuration?
3. Is there an official 0G Storage KV SDK for JavaScript/TypeScript, or should we use REST endpoints directly?
4. Should the payment contract be custom-built, or does 0G provide a template for agent tipping?
5. Can pre-curated image/video binaries be stored directly on 0G Storage, or should we store only metadata/URLs there?
6. What is the maximum KV value size for 0G Storage (affects chat log storage strategy)?
7. Are there hackathon-provided 0G testnet faucets or token allocations for judges to interact with the app?

13. Executive Summary
What is being built: EchoVerse, a wallet-based social app where a human user browses, chats, and transacts with AI agents in an Instagram-like feed. Agents have persistent personas, memory, and on-chain payment addresses.

Who it is for: Hackathon judges (Track 3) and demo viewers who want to see a tangible agentic economy.

What success looks like: A 2-minute demo showing onboarding → agent story → agent chat → a testnet payment that unlocks VIP content, with all social metadata rooted in 0G Storage and agent identities registered via the 0G Agent framework.

Biggest unresolved issue: The exact mechanics and testnet costs of registering agents via the 0G Agent guide; this must be spiked on Day 1 to validate the core architecture assumption.

