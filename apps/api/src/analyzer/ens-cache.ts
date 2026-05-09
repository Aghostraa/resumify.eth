import { createPublicClient, http } from 'viem';
import { sepolia } from 'viem/chains';
import { getEnsName, getEnsText } from 'viem/ens';
import { ALL_TEXT_RECORD_KEYS } from '@contractid/core';

const NAMESPACE = process.env.ENS_NAMESPACE ?? 'hallmarked.eth';

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

async function fetchRecords(ensName: string): Promise<Record<string, string>> {
  const client = getClient();
  const records: Record<string, string> = {};
  await Promise.allSettled(
    ALL_TEXT_RECORD_KEYS.map(async (k) => {
      const val = await getEnsText(client, { name: ensName, key: k }).catch(() => null);
      if (val) records[k] = val;
    }),
  );
  return records;
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

export async function getCachedAnalysis(address: string): Promise<CachedAnalysis | null> {
  const key = address.toLowerCase();

  // 1. Session cache — set immediately after mint, fastest path
  const cached = sessionCache.get(key);
  if (cached) return cached;

  const client = getClient();

  // 2. ENS reverse lookup — works for Ownable/ReverseClaimer contracts
  try {
    const ensName = await getEnsName(client, { address: address as `0x${string}` });
    if (ensName?.endsWith(`.${NAMESPACE}`)) {
      const records = await fetchRecords(ensName);
      if (Object.keys(records).length > 0) {
        const result = { ensName, records };
        sessionCache.set(key, result);
        return result;
      }
    }
  } catch { /* no reverse record set */ }

  // 3. Subgraph forward lookup — find slug-named subname by its addr record.
  //    Records are then fetched directly from the resolver (no subgraph lag on data).
  try {
    const ensName = await findNameByAddr(address);
    if (ensName) {
      const records = await fetchRecords(ensName);
      if (Object.keys(records).length > 0) {
        const result = { ensName, records };
        sessionCache.set(key, result);
        return result;
      }
    }
  } catch { /* subgraph unavailable */ }

  return null;
}
