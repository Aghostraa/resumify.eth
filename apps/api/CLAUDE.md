# ContractID — CLAUDE.md
## AI-Powered Smart Contract Identity & Intelligence Agent

---

## What We Are Building

**ContractID** is an AI agent that takes any smart contract and transforms it from an anonymous address into a fully named, scored, classified, and persistent onchain identity — using Sourcify as the intelligence backbone and ENS as the identity layer.

### The One-Line Pitch
> Any contract goes in → a named, scored, verified onchain entity comes out.

### The Core Loop (never lose sight of this)
```
Contract Address / Source Code
        ↓
  Sourcify Query (real data, no faking)
        ↓
  AI Analysis (pattern match, risk score, classification)
        ↓
  ENS Subname Registration (e.g. 0xabc123.contracts.eth)
        ↓
  ENS Text Records Written (score, pattern, risk flags, chain presence)
        ↓
  Human-readable Contract Identity Card (UI output)
        ↓
  Resolvable forever — by anyone, any tool, any chain
```

---

## What This Is NOT

- NOT a custom trained model. Use RAG (Retrieval Augmented Generation) — query Sourcify at runtime and feed results as context to the LLM. Never claim the model was "trained on Sourcify."
- NOT analyzing all 27M contracts in real time. Use pre-cached results for demo + live API for the submitted contract.
- NOT a finished regulatory compliance tool. It is the infrastructure layer regulators would build on.
- NOT a security auditor. It is a pattern matcher and risk scorer relative to verified contracts.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Tailwind (single page, clean UI) |
| AI Agent | Claude API (claude-sonnet-4-20250514) via Anthropic SDK |
| Contract Data | Sourcify API + Google BigQuery (pre-cached top patterns) |
| Identity Layer | ENS — viem + @ensdomains/ensjs |
| Chain | Ethereum Sepolia testnet (for ENS registration during demo) |
| Backend | Node.js or Python FastAPI — whichever is faster for the team |

---

## The Five Features to Demo (in order of priority)

### Feature 1 — Contract Intake & Sourcify Verification ✅ MUST HAVE
- User pastes a contract address or raw Solidity source
- System queries Sourcify API: is it verified? Get source code, ABI, compiler metadata, bytecode
- If not verified, show what partial data is available
- Display raw Sourcify data clearly before AI processes it
- **Why it matters for judges:** proves Sourcify is a live, core dependency — not decorative

### Feature 2 — AI Pattern Classification & Scoring ✅ MUST HAVE
- AI agent receives Sourcify data + pre-cached similar contracts from BigQuery
- Classifies contract into a known pattern: ERC-20, ERC-721, Uniswap V2 Pair, Proxy, Multisig, etc.
- Generates a Trust Score (0-100) with four sub-scores:
  - **Verification Score** — is source verified on Sourcify? (0-25)
  - **Pattern Match Score** — how closely does it match a battle-tested pattern? (0-25)
  - **Risk Flag Score** — does it contain structures found in exploited contracts? (0-25)
  - **Ecosystem Adoption Score** — how widely is this pattern used across chains? (0-25)
- Every score component shows its source data — no black box outputs
- **Why it matters for judges:** AI doing real reasoning over real data, not hallucinating

### Feature 3 — ENS Identity Minting ✅ MUST HAVE
- Agent registers an ENS subname for the contract under the project namespace
  - Format: `[short-hash].[pattern].contractid.eth`
  - Example: `a3f9.erc20.contractid.eth`
- Writes the following text records to the ENS name:
  - `trust-score` — the numeric score (e.g., "82/100")
  - `pattern` — classified pattern name (e.g., "uniswap-v2-pair")
  - `sourcify-verified` — "true" / "false" / "partial"
  - `risk-flags` — comma separated list of any detected risks
  - `chains` — which chains this contract or pattern exists on
  - `similar-to` — ENS name of the most similar verified contract
  - `classified-at` — timestamp
- Show the ENS resolution working live in the demo
- **Why it matters for judges:** ENS is doing real work — subname registration + text record writes. Removing ENS breaks the product.

### Feature 4 — Contract Identity Card UI ✅ MUST HAVE
- A clean, shareable card that shows:
  - The ENS name (big, prominent)
  - The trust score with visual breakdown
  - Pattern classification with plain-language explanation
  - Risk flags with plain-language descriptions
  - Chain presence map
  - Link to Sourcify verified source
  - "Similar to" — links to other ENS-named contracts in the same pattern family
- Card should feel like a passport or a credit report — authoritative, readable
- **Why it matters for judges:** makes the whole system legible in 30 seconds

### Feature 5 — Ecosystem Pattern Map (NICE TO HAVE — build last)
- A visual graph of the top 10 most common patterns from Sourcify
- Each pattern node has an ENS name
- Show how the submitted contract connects to this map
- Click a pattern node to see all contracts classified under it
- **Why it matters for judges:** shows the scalability vision without needing to build it fully

---

## ENS Integration — Exact Requirements

This is the part judges will scrutinize hardest. It must be real.

```javascript
// The ENS namespace to register under — set this up before the hackathon starts
const PROJECT_NAMESPACE = "contractid.eth" // or contractid-demo.eth on Sepolia

// Subname format
// [first 6 chars of address].[pattern-slug].contractid.eth
// e.g. a3f9c2.erc20.contractid.eth

// Text records to write — these must be written onchain, not just displayed in UI
const TEXT_RECORDS = {
  "trust-score": "82/100",
  "pattern": "erc20-standard",
  "sourcify-verified": "true",
  "risk-flags": "none",
  "chains": "mainnet,arbitrum,optimism",
  "similar-to": "usdc-impl.erc20.contractid.eth",
  "classified-at": "2025-05-08T14:32:00Z",
  "description": "Standard ERC-20 token. Matches OpenZeppelin v4.9 implementation pattern."
}

// Resolution must work — demo resolving the name and reading records back
```

**Critical:** No hardcoded ENS values in the demo. Every name and record must be generated from real Sourcify data + AI analysis at runtime.

---

## Sourcify Integration — Exact Requirements

```
Primary: Sourcify API
  GET https://sourcify.dev/server/v2/contract/{chainId}/{address}
  Returns: source files, ABI, compiler metadata, bytecode

Secondary: Pre-cached BigQuery results
  - Top 20 most common contract patterns with stats
  - Known exploit patterns (reentrancy, integer overflow structures, etc.)
  - Chain distribution data per pattern

Do NOT: Query BigQuery live during demo — it will be slow. Pre-cache.
DO: Query Sourcify API live for the submitted contract — this proves real integration.
```

---

## AI Agent Architecture

The AI agent is NOT a simple LLM call. It is a pipeline:

```
Step 1 — FETCH
  Call Sourcify API for submitted contract
  Load pre-cached pattern library from BigQuery results

Step 2 — ANALYZE (LLM call 1)
  System prompt: "You are a smart contract analyst. Given the following verified 
  contract data from Sourcify and the following known patterns, classify this 
  contract and identify any risk structures."
  Input: Sourcify data + top 5 most similar patterns from cache
  Output: Pattern classification + risk flags (structured JSON)

Step 3 — SCORE (deterministic, not LLM)
  Calculate each sub-score from structured Step 2 output
  This is code, not AI — prevents hallucinated scores

Step 4 — EXPLAIN (LLM call 2)
  System prompt: "Given this contract's classification and score, write a plain 
  English explanation a non-technical user can understand."
  Input: Score breakdown + pattern classification
  Output: Human-readable description for the identity card

Step 5 — MINT
  Register ENS subname
  Write text records
  Return ENS name + transaction hash as proof
```

**Why two LLM calls:** Keeps scoring deterministic and auditable. AI does reasoning, code does math.

---

## Demo Script (what judges will see)

1. Open the UI — clean, single page
2. Paste in a real contract address (prepare 3 good examples in advance — see below)
3. Watch Sourcify query fire live — show the raw API response briefly
4. AI analysis runs — show the thinking process, not just the result
5. Score appears with breakdown — each component sourced to real data
6. ENS registration fires — show the transaction on Sepolia Etherscan
7. ENS name appears — resolve it live, show text records
8. Identity Card renders — shareable, readable, complete
9. Show the "Similar to" link — proves the ecosystem map concept

**Prepare these 3 demo contracts in advance:**
- A well-known clean contract (e.g., USDC on Sepolia) — should score 90+
- A standard but unverified contract — should score 40-60, show verification gap
- A contract with known risk patterns — should score low, flags should fire

---

## Folder Structure

```
contractid/
├── CLAUDE.md                  ← this file
├── frontend/
│   ├── src/
│   │   ├── App.jsx            ← single page app
│   │   ├── components/
│   │   │   ├── ContractInput.jsx
│   │   │   ├── AnalysisProgress.jsx
│   │   │   ├── IdentityCard.jsx
│   │   │   ├── ScoreBreakdown.jsx
│   │   │   ├── EnsRecord.jsx
│   │   │   └── PatternMap.jsx  ← Feature 5, build last
│   │   └── api/
│   │       └── contractid.js   ← all backend calls
├── backend/
│   ├── agent/
│   │   ├── pipeline.js         ← the 5-step agent pipeline
│   │   ├── sourcify.js         ← Sourcify API wrapper
│   │   ├── scorer.js           ← deterministic scoring logic
│   │   └── ens.js              ← ENS registration + text records
│   ├── cache/
│   │   └── patterns.json       ← pre-cached BigQuery pattern data
│   └── index.js                ← API server
├── scripts/
│   └── setup-ens-namespace.js  ← run this FIRST to register contractid.eth
└── .env.example
```

---

## Environment Variables Needed

```
ANTHROPIC_API_KEY=
SOURCIFY_API_URL=https://sourcify.dev/server
ENS_PRIVATE_KEY=          # wallet that owns contractid.eth on Sepolia
ENS_RPC_URL=              # Sepolia RPC (Alchemy or Infura)
ENS_NAMESPACE=contractid.eth
```

---

## Build Order (two days)

### Day 1 — Backend + Integrations
- [ ] Register `contractid.eth` (or subdomain) on Sepolia — do this immediately
- [ ] Build Sourcify API wrapper — test with 3 known contracts
- [ ] Build and cache BigQuery pattern library (top 20 patterns + stats)
- [ ] Build AI pipeline (Steps 1-4)
- [ ] Build deterministic scorer
- [ ] Build ENS registration + text record writer
- [ ] Expose as REST API endpoint: `POST /api/analyze` → returns full identity object
- [ ] Test end-to-end with all 3 demo contracts

### Day 2 — Frontend + Polish
- [ ] Build Contract Input component
- [ ] Build Analysis Progress (animated, show each pipeline step firing)
- [ ] Build Identity Card (this is your hero UI — make it beautiful)
- [ ] Build Score Breakdown component
- [ ] Build ENS Record display (show live resolution)
- [ ] Wire up to backend
- [ ] Test full demo flow 10 times until it's smooth
- [ ] Build Pattern Map (Feature 5) only if Day 2 has spare time
- [ ] Record backup demo video in case of live demo failure

---

## Judging Criteria Mapping

| Judge Question | How We Answer |
|---------------|---------------|
| "Is ENS central?" | Remove ENS → no persistent identity, no text records, no resolution. Yes, it's central. |
| "Is Sourcify used deeply?" | Every score component traces to a Sourcify data field. Show this. |
| "Is this novel?" | Named + scored + classified contracts as ENS identities — this doesn't exist. |
| "Is the demo functional?" | 3 pre-tested contracts, backup video, no hardcoded values. |
| "Can you explain it in 3 minutes?" | Input → Sourcify → AI → Score → ENS → Card. Five steps, one sentence each. |

---

## What to Say to Judges

**Opening line:**
"Every smart contract is currently anonymous. You can't tell what it does, whether it's safe, or whether it's the same one you used before — not without digging through raw code. ContractID gives every contract a name, a score, and a permanent identity."

**The ENS pitch:**
"We use ENS not as a label but as the persistence layer. The score, the pattern, the risk flags — they live on the ENS name forever. Any wallet, any tool, any regulator can resolve `a3f9c2.erc20.contractid.eth` and instantly know what this contract is."

**The Sourcify pitch:**
"The intelligence comes from Sourcify's 27 million verified contracts. We're not making this up — every score component points to real verified contracts that match or diverge from the one you submitted."

**The vision:**
"What you're seeing is the MVP. The full vision is that every contract on every EVM chain gets this treatment automatically — a living, queryable, human-readable registry of what the entire ecosystem has built."

---

## Hard Rules — Never Break These

1. **Never hardcode ENS names or scores** — everything must be generated from real data
2. **Never claim the AI was trained on Sourcify** — it reasons over Sourcify data at runtime
3. **Never fake an ENS transaction** — show real Sepolia txn hash or don't show it
4. **Never let the AI generate scores directly** — scores are calculated by code from AI's structured output
5. **Always show data sources** — every score component links to the Sourcify data that produced it
