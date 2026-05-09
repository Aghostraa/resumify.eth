import { Router, type Router as ExpressRouter } from 'express';
import { createPublicClient, http, namehash } from 'viem';
import { sepolia } from 'viem/chains';
import { runPipeline } from './pipeline.js';
import { DEFAULT_DEMO_CHAIN_ID } from '@contractid/config';

export const analyzerRouter: ExpressRouter = Router();

const PUBLIC_RESOLVER_SEPOLIA = '0x8FADE66B79cC9f707aB26799354482EB93a5B7dD';
const AGENT_RECORD_KEYS = ['name', 'description', 'agent-context', 'agent-endpoint[web]'];
const RESOLVER_TEXT_ABI = [
  {
    name: 'text',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'node', type: 'bytes32' }, { name: 'key', type: 'string' }],
    outputs: [{ type: 'string' }],
  },
] as const;

let cachedAgentRecords: { ensName: string; records: Record<string, string> } | null = null;

async function readAgentRecords(ensName: string): Promise<Record<string, string> | null> {
  if (!process.env.ENS_RPC_URL || !ensName) return null;
  if (cachedAgentRecords?.ensName === ensName) return cachedAgentRecords.records;

  const client = createPublicClient({ chain: sepolia, transport: http(process.env.ENS_RPC_URL) });
  const node = namehash(ensName);
  const records: Record<string, string> = {};
  for (const key of AGENT_RECORD_KEYS) {
    try {
      const value = (await client.readContract({
        address: PUBLIC_RESOLVER_SEPOLIA,
        abi: RESOLVER_TEXT_ABI,
        functionName: 'text',
        args: [node, key],
      })) as string;
      if (value) records[key] = value;
    } catch (err) {
      console.warn(`[readAgentRecords] ${key} failed: ${err instanceof Error ? err.message : err}`);
    }
  }
  cachedAgentRecords = { ensName, records };
  return records;
}

analyzerRouter.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'contractid-api' });
});

analyzerRouter.get('/api/agent', async (_req, res) => {
  const namespace = process.env.ENS_NAMESPACE;
  const explicit = process.env.AGENT_ENS_NAME;
  const ensName = explicit || (namespace ? `analyzer.${namespace}` : null);

  let records: Record<string, string> | null = null;
  let recordsError: string | null = null;
  try {
    if (ensName) records = await readAgentRecords(ensName);
  } catch (err) {
    recordsError = err instanceof Error ? err.message : String(err);
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

analyzerRouter.post('/api/analyze', async (req, res) => {
  const { address, chainId = DEFAULT_DEMO_CHAIN_ID, sourceCode } = (req.body ?? {}) as {
    address?: string;
    chainId?: number;
    sourceCode?: string;
  };
  console.log(`[POST /api/analyze] address=${address} chainId=${chainId} hasSource=${!!sourceCode}`);

  if (!address && !sourceCode) {
    res.status(400).json({ error: 'Provide either an address or sourceCode' });
    return;
  }

  try {
    const result = await runPipeline({ address: address!, chainId, sourceCode });
    console.log(
      `[POST /api/analyze] OK score=${result.score?.total} pattern=${result.classification?.pattern} ens=${result.ens?.name ?? 'skipped'}`,
    );
    res.json(result);
  } catch (err) {
    console.error('[/api/analyze] failed:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'pipeline failed' });
  }
});
