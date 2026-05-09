/**
 * One-time bootstrap: mint an ENS subname for the analyzer agent itself
 * and write ENSIP-26 standard text records on it.
 *
 *   ENSIP-26 keys we set:
 *     agent-context        — JSON describing the agent's capabilities
 *     agent-endpoint[web]  — public URL where the agent UI lives
 *     name                 — human-readable label
 *     description          — short pitch
 *
 * Idempotent: re-running overwrites text records, doesn't error.
 *
 * Usage from /backend:
 *   node scripts/register-agent-identity.js
 *   node scripts/register-agent-identity.js --label=agent --web=https://demo.example.com
 */
import 'dotenv/config';
import { createPublicClient, createWalletClient, http, namehash } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';

const args = Object.fromEntries(
  process.argv.slice(2).map((s) => {
    const m = s.match(/^--([^=]+)=(.+)$/);
    return m ? [m[1], m[2]] : [s.replace(/^--/, ''), 'true'];
  })
);

const ENS_NAMESPACE = process.env.ENS_NAMESPACE;
const ENS_RPC_URL = process.env.ENS_RPC_URL;
const ENS_PRIVATE_KEY = process.env.ENS_PRIVATE_KEY;
const AGENT_LABEL = (args.label ?? 'analyzer').toLowerCase();
const AGENT_WEB = args.web ?? 'http://localhost:5173';

const NAME_WRAPPER_SEPOLIA = '0x0635513f179D50A207757E05759CbD106d7dFcE8';
const PUBLIC_RESOLVER_SEPOLIA = '0x8FADE66B79cC9f707aB26799354482EB93a5B7dD';

const NAME_WRAPPER_ABI = [
  { name: 'getData', type: 'function', stateMutability: 'view',
    inputs: [{ name: 'id', type: 'uint256' }],
    outputs: [
      { name: 'owner', type: 'address' },
      { name: 'fuses', type: 'uint32' },
      { name: 'expiry', type: 'uint64' },
    ] },
  { name: 'setSubnodeRecord', type: 'function', stateMutability: 'nonpayable',
    inputs: [
      { name: 'parentNode', type: 'bytes32' },
      { name: 'label', type: 'string' },
      { name: 'owner', type: 'address' },
      { name: 'resolver', type: 'address' },
      { name: 'ttl', type: 'uint64' },
      { name: 'fuses', type: 'uint32' },
      { name: 'expiry', type: 'uint64' },
    ],
    outputs: [{ type: 'bytes32' }] },
];

const RESOLVER_ABI = [
  { name: 'setText', type: 'function', stateMutability: 'nonpayable',
    inputs: [
      { name: 'node', type: 'bytes32' },
      { name: 'key', type: 'string' },
      { name: 'value', type: 'string' },
    ],
    outputs: [] },
];

if (!ENS_NAMESPACE || !ENS_RPC_URL || !ENS_PRIVATE_KEY) {
  console.error('Missing ENS_NAMESPACE, ENS_RPC_URL, or ENS_PRIVATE_KEY in backend/.env');
  process.exit(1);
}

const account = privateKeyToAccount(ENS_PRIVATE_KEY);
const wc = createWalletClient({ account, chain: sepolia, transport: http(ENS_RPC_URL) });
const pc = createPublicClient({ chain: sepolia, transport: http(ENS_RPC_URL) });

const fullName = `${AGENT_LABEL}.${ENS_NAMESPACE}`;
const parentNode = namehash(ENS_NAMESPACE);
const subnode = namehash(fullName);
const parentTokenId = BigInt(parentNode);

console.log('=== Agent ENS Identity Bootstrap ===');
console.log(`Wallet:        ${account.address}`);
console.log(`Agent name:    ${fullName}`);
console.log(`Web endpoint:  ${AGENT_WEB}\n`);

// Read parent expiry so subname expiry doesn't exceed it
const parentData = await pc.readContract({
  address: NAME_WRAPPER_SEPOLIA, abi: NAME_WRAPPER_ABI,
  functionName: 'getData', args: [parentTokenId],
});
const parentExpiry = parentData[2];
console.log(`Parent expiry: ${new Date(Number(parentExpiry) * 1000).toISOString()}\n`);

// 1. Create / overwrite subname
console.log(`→ Minting subname ${fullName}…`);
const subTx = await wc.writeContract({
  address: NAME_WRAPPER_SEPOLIA, abi: NAME_WRAPPER_ABI,
  functionName: 'setSubnodeRecord',
  args: [parentNode, AGENT_LABEL, account.address, PUBLIC_RESOLVER_SEPOLIA, 0n, 0, parentExpiry],
});
console.log(`  tx: ${subTx}`);
await pc.waitForTransactionReceipt({ hash: subTx, timeout: 120_000 });
console.log('  ✓ subname mined');

// 2. Build agent-context payload (ENSIP-26)
const agentContext = {
  schema: 'ensip-26',
  name: 'ContractID Analyzer',
  version: '0.1.0',
  description:
    'AI agent that classifies smart contracts by pattern, computes a 4-axis trust score from Sourcify-verified data, and mints an ENS identity per analyzed contract.',
  capabilities: [
    'contract-pattern-classification',
    'risk-flag-detection',
    'trust-scoring',
    'ens-subname-issuance',
    'sourcify-verification-lookup',
  ],
  model: process.env.CLAUDE_MODEL ?? 'claude-sonnet-4-6',
  dataSources: ['sourcify-v2', 'curated-pattern-library'],
  ensParent: ENS_NAMESPACE,
  endpoints: {
    web: AGENT_WEB,
  },
};

const records = {
  name: 'ContractID Analyzer',
  description: 'AI agent for smart-contract pattern classification + ENS identity minting.',
  'agent-context': JSON.stringify(agentContext),
  'agent-endpoint[web]': AGENT_WEB,
};

console.log('\n→ Writing ENSIP-26 text records…');
for (const [key, value] of Object.entries(records)) {
  const tx = await wc.writeContract({
    address: PUBLIC_RESOLVER_SEPOLIA, abi: RESOLVER_ABI,
    functionName: 'setText',
    args: [subnode, key, value],
  });
  console.log(`  setText[${key}] → ${tx}`);
  await pc.waitForTransactionReceipt({ hash: tx, timeout: 120_000 });
}

console.log(`\n🎉 Agent identity ready.`);
console.log(`\nResolve at: https://app.ens.domains/${fullName}`);
console.log(`Etherscan:  https://sepolia.etherscan.io/tx/${subTx}`);
console.log(`\nAdd to backend/.env:`);
console.log(`  AGENT_ENS_NAME=${fullName}`);
