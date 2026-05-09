import type { DeployedContract } from '../types.js';

const CHAIN_URLS: Record<number, string> = {
  11155111: 'https://eth-sepolia.blockscout.com',
};
const CONCURRENCY = 4;
const BATCH_DELAY_MS = 300;
const MAX_RETRIES = 2;

interface BlockscoutTx {
  hash: string;
  block_number: number;
  timestamp: string;
  created_contract?: {
    hash: string;
    name: string | null;
    is_verified: boolean | null;
    is_scam: boolean;
  };
}

interface BlockscoutPage {
  items: BlockscoutTx[];
  next_page_params: { block_number: number; index: number; items_count: number } | null;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchPage(chainId: number, address: string, params: Record<string, string> = {}): Promise<BlockscoutPage> {
  const base = CHAIN_URLS[chainId];
  if (!base) throw new Error(`Blockscout: no URL for chain ${chainId}`);
  const url = new URL(`${base}/api/v2/addresses/${address}/transactions`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const res = await fetch(url.toString());
    if (res.status === 429) {
      // Rate limited — back off and retry
      await sleep(1000 * (attempt + 1));
      continue;
    }
    if (!res.ok) throw new Error(`Blockscout ${chainId}: ${res.status}`);
    return res.json() as Promise<BlockscoutPage>;
  }
  throw new Error(`Blockscout ${chainId}: rate limited after ${MAX_RETRIES} retries`);
}

export async function fetchDeployments(address: string, chainId: number): Promise<DeployedContract[]> {
  const contracts: DeployedContract[] = [];
  let pageParams: Record<string, string> = {};

  while (true) {
    let page: BlockscoutPage;
    try {
      page = await fetchPage(chainId, address, pageParams);
    } catch {
      break;
    }

    for (const tx of page.items) {
      if (!tx.created_contract) continue;
      contracts.push({
        address: tx.created_contract.hash,
        chainId,
        txHash: tx.hash,
        blockNumber: tx.block_number,
        deployedAt: tx.timestamp,
        contractName: tx.created_contract.name,
        compiler: null,
        compilerVersion: null,
        verified: tx.created_contract.is_verified ?? false,
        isScam: tx.created_contract.is_scam,
        blockscoutName: tx.created_contract.name,
      });
    }

    if (!page.next_page_params) break;
    pageParams = {
      block_number: String(page.next_page_params.block_number),
      index: String(page.next_page_params.index),
      items_count: String(page.next_page_params.items_count),
    };
  }

  return contracts;
}

export async function fetchDeploymentsAllChains(address: string, chainIds: number[]): Promise<DeployedContract[]> {
  const all: DeployedContract[] = [];

  for (let i = 0; i < chainIds.length; i += CONCURRENCY) {
    const batch = chainIds.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(batch.map((id) => fetchDeployments(address, id)));
    all.push(...results.flatMap((r) => (r.status === 'fulfilled' ? r.value : [])));
    if (i + CONCURRENCY < chainIds.length) await sleep(BATCH_DELAY_MS);
  }

  return all;
}
