import type { DeployedContract } from '../types.js';

const BASE_URL = 'https://api.blockscout.com';
const API_KEY = process.env.BLOCKSCOUT_API_KEY ?? '';

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

async function fetchPage(chainId: number, address: string, params: Record<string, string> = {}): Promise<BlockscoutPage> {
  const url = new URL(`${BASE_URL}/${chainId}/api/v2/addresses/${address}/transactions`);
  url.searchParams.set('apikey', API_KEY);
  url.searchParams.set('filter', 'to | created_contract');
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Blockscout ${chainId}: ${res.status}`);
  return res.json() as Promise<BlockscoutPage>;
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
  const results = await Promise.allSettled(chainIds.map((id) => fetchDeployments(address, id)));
  return results.flatMap((r) => (r.status === 'fulfilled' ? r.value : []));
}
