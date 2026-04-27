# Backlog

## Public 0G KV RPC read endpoint is unavailable

**Status:** Open

**Context:** Live 0G Storage writes now work through the local Flow ABI compatibility shim in `src/lib/0g-kv.ts`. Smoke tests successfully submit transactions, receive root hashes, and finalize segment upload.

**Current roadblock:** The public KV RPC endpoint from the TS SDK docs is not reachable:

```env
KV_RPC=http://3.101.147.150:6789
```

Direct JSON-RPC calls to `kv_getHoldingStreamIds` and `kv_getValue` time out. Because of that, true live KV reads are not currently available through this endpoint.

**Current workaround:** Keep `STORAGE_MODE=auto` and `MIRROR_0G_WRITES_LOCAL=true`. This preserves real 0G Storage writes while mirroring successful writes to `data/local-kv.json` for immediate app/demo readback.

**Resolution options:**

- Find and switch to a healthy official/public Galileo KV RPC endpoint.
- Run our own 0G Storage KV node for the EchoVerse stream ID.
- Continue using local mirror readback for demo resilience until a KV RPC endpoint is available.

**Done when:** `STORAGE_MODE=0g npm run kv:smoke` can write to 0G Storage and read the same key back through `KV_RPC` without local fallback.

## UI revamp beyond Phase 1 mockup

**Status:** Open

**Context:** The current frontend is a functional Phase 1 shell. Navigation, onboarding, feed, profile, post, and chat stubs exist, but the interface still reads like an MVP mockup rather than a polished consumer social product.

**Current roadblock:** Visual hierarchy, motion/state polish, dense social interactions, empty/loading/error states, and mobile ergonomics need a proper product design pass.

**Target direction:**

- Upgrade the home feed, stories, chat list, onboarding, and profile into cohesive production-quality screens.
- Replace placeholder/stub copy with real product language.
- Add stronger interaction states for save, wallet, posting, follow, comments, and chat.
- Ensure mobile-first polish and reduce mockup-like cards where a real social layout is expected.

**Done when:** A user can navigate the app and it feels like a real AI social product rather than a scaffolded demo.

## Realistic agent photo assets

**Status:** Open

**Context:** Current agent assets are placeholder SVG-style illustrations. They are useful for scaffolding but do not match the intended realistic social profile experience.

**Current roadblock:** Agents need coherent, realistic photo-style avatars and story/post images.

**Target direction:**

- Generate realistic agent portraits and lifestyle/story images using Stable Diffusion, Nano Banana, or an equivalent image pipeline.
- Keep each agent visually consistent across avatar, profile, story, and post imagery.
- Store final optimized assets under `public/assets/agents/`.
- Preserve existing filenames or update `src/data/agents.ts` in one pass to avoid broken references.

**Done when:** All six agents have realistic, coherent, production-ready photo assets for avatar and story/post use.
