import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createPublicClient, http, namehash } from 'viem';
import { sepolia } from 'viem/chains';
import { runPipeline } from './agent/pipeline.js';

const PUBLIC_RESOLVER_SEPOLIA = '0x8FADE66B79cC9f707aB26799354482EB93a5B7dD';
const AGENT_RECORD_KEYS = ['name', 'description', 'agent-context', 'agent-endpoint[web]'];
const RESOLVER_TEXT_ABI = [
  { name: 'text', type: 'function', stateMutability: 'view',
    inputs: [{ name: 'node', type: 'bytes32' }, { name: 'key', type: 'string' }],
    outputs: [{ type: 'string' }] },
];

let cachedAgentRecords = null;
async function readAgentRecords(ensName) {
  if (!process.env.ENS_RPC_URL || !ensName) return null;
  if (cachedAgentRecords?.ensName === ensName) return cachedAgentRecords.records;

  const client = createPublicClient({ chain: sepolia, transport: http(process.env.ENS_RPC_URL) });
  const node = namehash(ensName);
  const records = {};
  for (const key of AGENT_RECORD_KEYS) {
    try {
      const value = await client.readContract({
        address: PUBLIC_RESOLVER_SEPOLIA, abi: RESOLVER_TEXT_ABI,
        functionName: 'text', args: [node, key],
      });
      if (value) records[key] = value;
    } catch (err) {
      console.warn(`[readAgentRecords] ${key} failed: ${err.shortMessage ?? err.message}`);
    }
  }
  cachedAgentRecords = { ensName, records };
  return records;
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'contractid-backend' });
});

app.get('/api/agent', async (_req, res) => {
  const namespace = process.env.ENS_NAMESPACE;
  const explicit = process.env.AGENT_ENS_NAME;
  const ensName = explicit || (namespace ? `analyzer.${namespace}` : null);

  let records = null;
  let recordsError = null;
  try {
    records = await readAgentRecords(ensName);
  } catch (err) {
    recordsError = err.message;
  }

  res.json({
    ensName,
    namespace,
    ensProfileUrl: ensName ? `https://app.ens.domains/${ensName}` : null,
    ensipCompliance: ['ENSIP-26'],
    model: process.env.CLAUDE_MODEL ?? 'claude-sonnet-4-6',
    records,
    recordsError,
    resolver: PUBLIC_RESOLVER_SEPOLIA,
  });
});

app.post('/api/analyze', async (req, res) => {
  const { address, chainId = 11155111, sourceCode } = req.body ?? {};
  console.log(`[POST /api/analyze] address=${address} chainId=${chainId} hasSource=${!!sourceCode}`);

  if (!address && !sourceCode) {
    return res.status(400).json({ error: 'Provide either an address or sourceCode' });
  }

  try {
    const result = await runPipeline({ address, chainId, sourceCode });
    console.log(`[POST /api/analyze] OK — score=${result.score?.total} pattern=${result.classification?.pattern} ens=${result.ens?.name ?? 'skipped'}`);
    res.json(result);
  } catch (err) {
    console.error('[/api/analyze] failed:', err);
    res.status(500).json({ error: err.message ?? 'pipeline failed' });
  }
});

const PORT = process.env.PORT ?? 8787;
app.listen(PORT, () => {
  console.log(`ContractID backend listening on http://localhost:${PORT}`);
});
