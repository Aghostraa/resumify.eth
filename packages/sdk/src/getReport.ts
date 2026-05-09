import {
  createPublicClient,
  http,
  type Address,
  type PublicClient,
} from 'viem';
import { mainnet, sepolia, base, baseSepolia, optimism, arbitrum, linea } from 'viem/chains';
import { ALL_TEXT_RECORD_KEYS, type Report } from '@contractid/core';
import { getNetwork } from '@contractid/config';
import { parseReport } from './parse.js';

const VIEM_CHAINS = {
  1: mainnet,
  11155111: sepolia,
  8453: base,
  84532: baseSepolia,
  10: optimism,
  42161: arbitrum,
  59144: linea,
} as const;

export interface GetReportOptions {
  rpcUrl?: string;
  client?: PublicClient;
}

function clientFor(chainId: number, opts?: GetReportOptions): PublicClient {
  if (opts?.client) return opts.client;
  const chain = VIEM_CHAINS[chainId as keyof typeof VIEM_CHAINS];
  if (!chain) throw new Error(`No viem chain for chainId ${chainId}`);
  return createPublicClient({ chain, transport: http(opts?.rpcUrl) });
}

export async function getReport(
  address: Address,
  chainId: number,
  opts?: GetReportOptions,
): Promise<Report | null> {
  getNetwork(chainId);
  const client = clientFor(chainId, opts);

  const ensName = await client.getEnsName({ address }).catch(() => null);
  if (!ensName) return null;

  return getReportByEnsName(ensName, { address, chainId }, opts);
}

export async function getReportByEnsName(
  ensName: string,
  meta: { address: Address; chainId: number },
  opts?: GetReportOptions,
): Promise<Report | null> {
  const client = clientFor(meta.chainId, opts);

  const entries = await Promise.all(
    ALL_TEXT_RECORD_KEYS.map(async (key) => {
      const value = await client.getEnsText({ name: ensName, key }).catch(() => null);
      return [key, value] as const;
    }),
  );

  const records = Object.fromEntries(entries);
  return parseReport(records, { address: meta.address, chainId: meta.chainId, ensName });
}
