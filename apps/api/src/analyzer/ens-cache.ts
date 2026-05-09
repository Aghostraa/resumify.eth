import { createPublicClient, http, namehash } from 'viem';
import { sepolia } from 'viem/chains';
import { getEnsName } from 'viem/ens';
import { ALL_TEXT_RECORD_KEYS } from '@contractid/core';
import { deriveDeveloperLabel, PUBLIC_RESOLVER_SEPOLIA } from './developer-profile.js';

const NAMESPACE = process.env.ENS_NAMESPACE ?? 'hallmarked.eth';

const RESOLVER_TEXT_ABI = [
  {
    name: 'text',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'node', type: 'bytes32' }, { name: 'key', type: 'string' }],
    outputs: [{ type: 'string' }],
  },
] as const;

function getClient() {
  return createPublicClient({
    chain: sepolia,
    transport: http(process.env.RPC_URL_SEPOLIA ?? 'https://sepolia.drpc.org'),
  });
}

export interface CachedAnalysis {
  ensName: string;
  records: Record<string, string>;
}

const sessionCache = new Map<string, CachedAnalysis>();

export function setCachedAnalysis(address: string, data: CachedAnalysis) {
  sessionCache.set(address.toLowerCase(), data);
}


// Query ENS Sepolia subgraph for any name under our namespace whose addr record
// resolves to this address. Slug names (e.g. 60957f-brokenaccesscontrol.hallmarked.eth)
// can't be reconstructed from address alone — the subgraph is the right tool here.
async function findNameByAddr(address: string): Promise<string | null> {
  const endpoint =
    process.env.ENS_SUBGRAPH_URL ??
    'https://api.studio.thegraph.com/query/49574/enssepolia/version/latest';

  const query = `{
    domains(
      first: 1
      where: {
        resolvedAddress: "${address.toLowerCase()}"
        name_ends_with: ".${NAMESPACE}"
      }
    ) { name }
  }`;

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
    signal: AbortSignal.timeout(5000),
  });

  if (!res.ok) return null;
  const data = (await res.json()) as { data?: { domains?: { name: string }[] } };
  return data?.data?.domains?.[0]?.name ?? null;
}

async function fetchRecordsDirect(ensName: string): Promise<Record<string, string>> {
  const client = getClient();
  const node = namehash(ensName);
  const records: Record<string, string> = {};
  await Promise.allSettled(
    ALL_TEXT_RECORD_KEYS.map(async (k) => {
      try {
        const val = await client.readContract({
          address: PUBLIC_RESOLVER_SEPOLIA,
          abi: RESOLVER_TEXT_ABI,
          functionName: 'text',
          args: [node, k],
        }) as string;
        if (val) records[k] = val;
      } catch { /* skip */ }
    }),
  );
  return records;
}

export async function getCachedAnalysis(address: string, developerAddress?: string): Promise<CachedAnalysis | null> {
  const key = address.toLowerCase();

  // 1. Session cache
  const cached = sessionCache.get(key);
  if (cached) return cached;

  const client = getClient();

  // 2. Deterministic developer-scoped lookup — instant, no subgraph
  if (developerAddress) {
    try {
      const devEns = await getEnsName(client, { address: developerAddress as `0x${string}` }).catch(() => null);
      const devLabel = deriveDeveloperLabel(developerAddress, devEns);
      const ensName = `${address.slice(2, 8).toLowerCase()}.resume.${devLabel}.${NAMESPACE}`;
      const records = await fetchRecordsDirect(ensName);
      if (Object.keys(records).length > 0) {
        const result = { ensName, records };
        sessionCache.set(key, result);
        return result;
      }
    } catch { /* fall through */ }
  }

  // 3. ENS reverse lookup — works for Ownable/ReverseClaimer contracts
  try {
    const ensName = await getEnsName(client, { address: address as `0x${string}` });
    if (ensName?.endsWith(`.${NAMESPACE}`)) {
      const records = await fetchRecordsDirect(ensName);
      if (Object.keys(records).length > 0) {
        const result = { ensName, records };
        sessionCache.set(key, result);
        return result;
      }
    }
  } catch { /* no reverse record */ }

  // 4. Subgraph forward lookup — fallback for legacy slug names
  try {
    const ensName = await findNameByAddr(address);
    if (ensName) {
      const records = await fetchRecordsDirect(ensName);
      if (Object.keys(records).length > 0) {
        const result = { ensName, records };
        sessionCache.set(key, result);
        return result;
      }
    }
  } catch { /* subgraph unavailable */ }

  return null;
}
