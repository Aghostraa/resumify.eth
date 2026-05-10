/**
 * Bootstrap / refresh the ENS identity for the Hallmark analyzer agent.
 *
 * Sets text records following:
 *   - ENSIP-5  (text records)
 *   - ENSIP-18 (profile records: name, description, url, avatar)
 *   - ENSIP-26 (agent-context, agent-endpoint[protocol])
 *
 * All setText calls are batched into a single multicall transaction.
 * Re-running this script is safe — it overwrites records atomically.
 *
 * Usage:
 *   node scripts/register-agent-identity.js
 *   node scripts/register-agent-identity.js --label=analyzer-v0.1 --web=https://yourapp.com
 */
import 'dotenv/config';
import { createPublicClient, createWalletClient, http, namehash, encodeFunctionData } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';

// ── CLI args ─────────────────────────────────────────────────────────────────
const args = Object.fromEntries(
  process.argv.slice(2).map((s) => {
    const m = s.match(/^--([^=]+)=(.+)$/);
    return m ? [m[1], m[2]] : [s.replace(/^--/, ''), 'true'];
  })
);

// ── Config (env + overridable via CLI) ───────────────────────────────────────
const ENS_NAMESPACE   = process.env.ENS_NAMESPACE;
const ENS_RPC_URL     = process.env.ENS_RPC_URL;
const ENS_PRIVATE_KEY = process.env.ENS_PRIVATE_KEY;
const CLAUDE_MODEL    = process.env.CLAUDE_MODEL ?? 'claude-sonnet-4-6';
const AGENT_LABEL     = (args.label ?? 'analyzer').toLowerCase();
const WEB_URL         = args.web ?? process.env.AGENT_WEB_URL ?? 'http://localhost:5173';
const MCP_URL         = args.mcp ?? process.env.AGENT_MCP_URL ?? null;
const A2A_URL         = args.a2a ?? process.env.AGENT_A2A_URL ?? null;

if (!ENS_NAMESPACE || !ENS_RPC_URL || !ENS_PRIVATE_KEY) {
  console.error('Missing ENS_NAMESPACE, ENS_RPC_URL, or ENS_PRIVATE_KEY in .env');
  process.exit(1);
}

// ── Contracts ────────────────────────────────────────────────────────────────
const NAME_WRAPPER_SEPOLIA  = '0x0635513f179D50A207757E05759CbD106d7dFcE8';
const PUBLIC_RESOLVER_SEPOLIA = '0x8FADE66B79cC9f707aB26799354482EB93a5B7dD';

const NAME_WRAPPER_ABI = [
  {
    name: 'getData', type: 'function', stateMutability: 'view',
    inputs: [{ name: 'id', type: 'uint256' }],
    outputs: [
      { name: 'owner',  type: 'address' },
      { name: 'fuses',  type: 'uint32'  },
      { name: 'expiry', type: 'uint64'  },
    ],
  },
  {
    name: 'setSubnodeRecord', type: 'function', stateMutability: 'nonpayable',
    inputs: [
      { name: 'parentNode', type: 'bytes32' },
      { name: 'label',      type: 'string'  },
      { name: 'owner',      type: 'address' },
      { name: 'resolver',   type: 'address' },
      { name: 'ttl',        type: 'uint64'  },
      { name: 'fuses',      type: 'uint32'  },
      { name: 'expiry',     type: 'uint64'  },
    ],
    outputs: [{ type: 'bytes32' }],
  },
];

const RESOLVER_ABI = [
  {
    name: 'setText', type: 'function', stateMutability: 'nonpayable',
    inputs: [
      { name: 'node',  type: 'bytes32' },
      { name: 'key',   type: 'string'  },
      { name: 'value', type: 'string'  },
    ],
    outputs: [],
  },
  {
    name: 'multicall', type: 'function', stateMutability: 'nonpayable',
    inputs: [{ name: 'data', type: 'bytes[]' }],
    outputs: [{ name: 'results', type: 'bytes[]' }],
  },
];

// ── Setup ────────────────────────────────────────────────────────────────────
const account = privateKeyToAccount(ENS_PRIVATE_KEY);
const wc = createWalletClient({ account, chain: sepolia, transport: http(ENS_RPC_URL) });
const pc = createPublicClient({ chain: sepolia, transport: http(ENS_RPC_URL) });

const fullName   = `${AGENT_LABEL}.${ENS_NAMESPACE}`;
const parentNode = namehash(ENS_NAMESPACE);
const subnode    = namehash(fullName);

console.log('=== Hallmark Agent ENS Identity Bootstrap ===');
console.log(`Wallet:     ${account.address}`);
console.log(`Name:       ${fullName}`);
console.log(`Namespace:  ${ENS_NAMESPACE}`);
console.log(`Model:      ${CLAUDE_MODEL}`);
console.log(`Web:        ${WEB_URL}`);
if (MCP_URL) console.log(`MCP:        ${MCP_URL}`);
if (A2A_URL) console.log(`A2A:        ${A2A_URL}`);
console.log();

// ── 1. Create / update the subname ───────────────────────────────────────────
const parentData = await pc.readContract({
  address: NAME_WRAPPER_SEPOLIA,
  abi: NAME_WRAPPER_ABI,
  functionName: 'getData',
  args: [BigInt(parentNode)],
});
const parentExpiry = parentData[2];
console.log(`Parent expiry: ${new Date(Number(parentExpiry) * 1000).toISOString()}`);

console.log(`\n→ Registering subname ${fullName}…`);
const subTx = await wc.writeContract({
  address: NAME_WRAPPER_SEPOLIA,
  abi: NAME_WRAPPER_ABI,
  functionName: 'setSubnodeRecord',
  args: [parentNode, AGENT_LABEL, account.address, PUBLIC_RESOLVER_SEPOLIA, 0n, 0, parentExpiry],
});
console.log(`  tx: ${subTx}`);
await pc.waitForTransactionReceipt({ hash: subTx, timeout: 120_000 });
console.log('  ✓ subname confirmed\n');

// ── 2. Build text records ─────────────────────────────────────────────────────
// agent-context (ENSIP-26): describes the agent — its purpose, capabilities,
// model, data sources, and the ENS namespace it manages.
const agentContext = JSON.stringify({
  specVersion: 'ensip-26',
  name: `Hallmark Contract Analyzer (${AGENT_LABEL})`,
  version: AGENT_LABEL,
  description:
    'AI agent that classifies smart contracts by pattern, computes a 4-axis trust score ' +
    'from Sourcify-verified source data, detects security risks, and mints a permanent ENS ' +
    'subname identity with onchain text records per analyzed contract.',
  model: CLAUDE_MODEL,
  capabilities: [
    'contract-pattern-classification',
    'sourcify-verification-lookup',
    'trust-score-4-axis',          // verification · pattern-match · risk-flags · ecosystem
    'risk-flag-detection',
    'security-checks',             // reentrancy, access-control, unchecked-calls, frontrun
    'ens-subname-issuance',
    'onchain-attestation-eas',
  ],
  dataSources: [
    'sourcify-v2-api',
    'curated-pattern-library',
    'ethguard-security-checks',
    'oli-label-registry',
  ],
  ensNamespace: ENS_NAMESPACE,
  issuedSubnameFormat: `{addr6}-{slug}.${ENS_NAMESPACE}`,
  issuedTextRecordSchema: 'contractid-v1',
  endpoints: {
    web: WEB_URL,
    ...(MCP_URL ? { mcp: MCP_URL } : {}),
    ...(A2A_URL ? { a2a: A2A_URL } : {}),
  },
}, null, 2);

const PATTERNS_URL = 'https://raw.githubusercontent.com/Aghostraa/resumify.eth/main/apps/api/cache/patterns.json';

// Standard ENS profile records (ENSIP-18) + ENSIP-26 agent records
const records = {
  // ENSIP-18 profile
  'name':        `Hallmark Analyzer (${AGENT_LABEL})`,
  'description': 'AI agent · smart contract identity · pattern classification · trust scoring · ENS subname issuance',
  'url':         WEB_URL,

  // Pattern library — fetched by the pipeline at runtime
  'pattern-library': PATTERNS_URL,

  // ENSIP-26 agent records
  'agent-context':        agentContext,
  'agent-endpoint[web]':  WEB_URL,
  ...(MCP_URL ? { 'agent-endpoint[mcp]': MCP_URL } : {}),
  ...(A2A_URL ? { 'agent-endpoint[a2a]': A2A_URL } : {}),
};

// ── 3. Write all records in one multicall ─────────────────────────────────────
console.log(`→ Writing ${Object.keys(records).length} text records via multicall…`);
for (const [key, value] of Object.entries(records)) {
  const preview = value.length > 80 ? value.slice(0, 77) + '…' : value;
  console.log(`  ${key}: ${preview}`);
}
console.log();

const calls = Object.entries(records).map(([key, value]) =>
  encodeFunctionData({
    abi: RESOLVER_ABI,
    functionName: 'setText',
    args: [subnode, key, value],
  })
);

const mcTx = await wc.writeContract({
  address: PUBLIC_RESOLVER_SEPOLIA,
  abi: RESOLVER_ABI,
  functionName: 'multicall',
  args: [calls],
});
console.log(`  multicall tx: ${mcTx}`);
await pc.waitForTransactionReceipt({ hash: mcTx, timeout: 120_000 });
console.log('  ✓ all records confirmed\n');

// ── Done ──────────────────────────────────────────────────────────────────────
console.log('🎉 Agent identity ready.');
console.log(`\n  ENS app:   https://app.ens.domains/${fullName}`);
console.log(`  Etherscan: https://sepolia.etherscan.io/tx/${mcTx}`);
console.log(`\n  Add to .env:`);
console.log(`    AGENT_ENS_NAME=${fullName}`);
