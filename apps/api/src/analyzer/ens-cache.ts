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

export function setCachedAnalysis(_address: string, _data: CachedAnalysis) {
  // ENS is the source of truth — no in-memory cache needed
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
  const client = getClient();

  // Deterministic lookup — construct name directly, read live from ENS
  if (developerAddress) {
    try {
      const devEns = await getEnsName(client, { address: developerAddress as `0x${string}` }).catch(() => null);
      const devLabel = deriveDeveloperLabel(developerAddress, devEns);
      const ensName = `${address.slice(2, 8).toLowerCase()}.resume.${devLabel}.${NAMESPACE}`;
      const records = await fetchRecordsDirect(ensName);
      if (Object.keys(records).length > 0) return { ensName, records };
    } catch { /* fall through */ }
  }

  // ENS reverse lookup — works for Ownable/ReverseClaimer contracts
  try {
    const ensName = await getEnsName(client, { address: address as `0x${string}` });
    if (ensName?.endsWith(`.${NAMESPACE}`)) {
      const records = await fetchRecordsDirect(ensName);
      if (Object.keys(records).length > 0) return { ensName, records };
    }
  } catch { /* no reverse record */ }

  return null;
}
