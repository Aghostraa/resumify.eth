# Resumify — Onchain Developer Identity

Every smart contract is anonymous by default. Resumify gives contracts a name, a trust score, and a permanent identity — using [Sourcify](https://sourcify.dev) as the intelligence backbone and [ENS](https://ens.domains) as the identity layer.

**Live:** [resumify.vercel.app](https://resumify.vercel.app) · API: [hallmark-api.fly.dev](https://hallmark-api.fly.dev)

---

## What it does

1. **Resume** — paste an ENS name or address, get a full developer profile: all verified contracts across chains, pulled from Sourcify's BigQuery dataset and enriched by Blockscout (5s timeout, falls back to Sourcify-only on slow response)
2. **Analyze** — submit a contract address to run the AI pipeline: Sourcify fetch → OLI labels → Claude classification → security checks → trust score → ENS identity mint
3. **ENS Identity** — each analyzed contract gets an ENS subname (`{addr6}.resume.{dev}.hallmarked.eth`) with text records for trust score, pattern, risk flags, security findings, and description. Persists forever, readable by any tool
4. **Pattern Library** — stored as a text record on `analyzer-v0-1.hallmarked.eth` (Sepolia), fetched at runtime — no static files in production

---

## Trust Score (0–100)

| Axis | Max | Source |
|---|---|---|
| Verification | 25 | Sourcify exact/partial match |
| Pattern match | 25 | Similarity to known patterns |
| Risk flags | 25 | Detected risk structures |
| Ecosystem | 25 | Chain adoption breadth |
| Security | bonus | Reentrancy, access control, unchecked calls, frontrun |

---

## ENS Text Records

Each contract subname writes:

| Key | Example |
|---|---|
| `trust-score` | `82/100` |
| `pattern` | `erc20-standard` |
| `sourcify-verified` | `true` |
| `risk-flags` | `REENTRANCY-001,NO-REENTRANCY-GUARD-001` |
| `security-findings` | `reentrancy:fail,frontrun:safe` |
| `chains` | `sepolia` |
| `classified-at` | `2026-05-10T01:08:44.098Z` |
| `issued-by` | `analyzer-v0-1.hallmarked.eth` |
| `description` | plain-English explanation |

---

## Architecture

```
apps/
  api/        Node.js + Express — analyzer pipeline, deployer resume, ENS mint
  web/        React + Tailwind — dashboard, contracts table, analyzer UI
packages/
  core/       Shared types, scoring logic, security checks
  config/     Chain lists, supported networks
  sdk/        Report builder
contracts/    Solidity test contracts (Sepolia demo)
```

**Stack:** Claude API (claude-sonnet-4-6) · Sourcify v2 API · Sourcify BigQuery · ENS (viem + ensjs) · Blockscout API · OLI label registry · EAS attestations · Fly.io (API) · Vercel (frontend)

---

## API

```
GET  /resume/:nameOrAddress          Developer resume (deployments + profile)
GET  /resume/:nameOrAddress/stats    Stats only
GET  /api/analyze/stream             SSE pipeline stream — ?address=&chainId=&developer=
GET  /api/cached/:address            Live ENS lookup — returns records if previously analyzed
GET  /api/agent                      Agent identity (reads from analyzer-v0-1.hallmarked.eth)
GET  /api/health                     Health check
POST /verify/:chainId/:address       Submit for Sourcify verification
```

---

## Local Development

```bash
pnpm install

# API
cp apps/api/.env.example apps/api/.env
# fill in ANTHROPIC_API_KEY, ENS_PRIVATE_KEY, RPC_URL_SEPOLIA, ENS_NAMESPACE
pnpm --filter @contractid/api dev

# Web
pnpm --filter @contractid/web dev
```

### Required env vars (API)

| Variable | Purpose |
|---|---|
| `ANTHROPIC_API_KEY` | Claude API |
| `ENS_PRIVATE_KEY` | Wallet that owns the ENS namespace |
| `ENS_NAMESPACE` | e.g. `hallmarked.eth` |
| `RPC_URL_SEPOLIA` | Sepolia RPC (Alchemy / Infura) |
| `BLOCKSCOUT_API_KEY` | Optional — unlocks Pro API |
| `GOOGLE_APPLICATION_CREDENTIALS` | BigQuery service account |

---

## Deploy

```bash
# API (Fly.io)
pnpm --filter @contractid/api bundle
flyctl deploy --config apps/api/fly.toml

# Frontend (Vercel)
pnpm --filter @contractid/web build
vercel --prod
```

---

## Agent Identity

The analyzer agent is registered on Sepolia ENS at `analyzer-v0-1.hallmarked.eth` following [ENSIP-26](https://docs.ens.domains/ensip/26). Text records include `agent-context`, `agent-endpoint[web]`, and `pattern-library` (URL to the contract pattern dataset).

To refresh agent records:
```bash
node apps/api/scripts/register-agent-identity.js --label=analyzer-v0-1
```

---

Built at ETHPrague 2026
