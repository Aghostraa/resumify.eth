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

// In-memory cache for the current session (pre-reverse-resolution)
const sessionCache = new Map<string, CachedAnalysis>();

export function setCachedAnalysis(address: string, data: CachedAnalysis) {
  sessionCache.set(address.toLowerCase(), data);
}

export async function getCachedAnalysis(address: string): Promise<CachedAnalysis | null> {
  const key = address.toLowerCase();

  // Session cache first (works before reverse resolution is set)
  const session = sessionCache.get(key);
  if (session) return session;

  // ENS reverse lookup (permanent, works across sessions after user Enscribes)
  try {
    const client = getClient();
    const ensName = await getEnsName(client, { address: address as `0x${string}` });
    if (!ensName?.endsWith(`.${NAMESPACE}`)) return null;

    const records: Record<string, string> = {};
    await Promise.allSettled(
      ALL_TEXT_RECORD_KEYS.map(async (key) => {
        const val = await getEnsText(client, { name: ensName, key }).catch(() => null);
        if (val) records[key] = val;
      }),
    );

    if (Object.keys(records).length === 0) return null;
    const result = { ensName, records };
    sessionCache.set(key, result);
    return result;
  } catch {
    return null;
  }
}
