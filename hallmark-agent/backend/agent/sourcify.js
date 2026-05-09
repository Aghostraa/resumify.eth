import axios from 'axios';

const SOURCIFY_BASE = process.env.SOURCIFY_API_URL ?? 'https://sourcify.dev/server';

export async function fetchSourcify({ chainId, address }) {
  if (!address) {
    return { status: 'no-address', verified: false, source: null };
  }

  // v2 needs explicit ?fields= to return abi/sources/etc. Without it you only get match metadata.
  const url = `${SOURCIFY_BASE}/v2/contract/${chainId}/${address}?fields=abi,sources,metadata,compilation,deployment`;

  try {
    const { data } = await axios.get(url, { timeout: 15_000 });
    const matchType = data?.match ?? data?.runtimeMatch ?? data?.status ?? 'unknown';
    const verified = matchType === 'exact_match' || matchType === 'perfect' || matchType === 'match';
    const partial = matchType === 'partial_match' || matchType === 'partial';

    return {
      status: 'ok',
      verified,
      partial,
      matchType,
      address,
      chainId,
      contractName: data?.compilation?.name ?? data?.compilation?.contractName ?? data?.contractName ?? null,
      compilerVersion: data?.compilation?.compilerVersion ?? data?.compilerVersion ?? null,
      abi: data?.abi ?? null,
      sources: data?.sources ?? null,
      metadata: data?.metadata ?? null,
      raw: data,
    };
  } catch (err) {
    if (err.response?.status === 404) {
      return {
        status: 'not-verified',
        verified: false,
        partial: false,
        address,
        chainId,
        message: 'Contract not found on Sourcify',
      };
    }
    throw new Error(`Sourcify request failed: ${err.message}`);
  }
}
