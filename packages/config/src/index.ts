import type { ChainName } from '@contractid/core';

export interface NetworkConfig {
  chainId: number;
  name: ChainName;
  enscribeChainName: ChainName;
  sourcifyChainId: number;
  ensParent: string;
  rpcUrlEnvKey: string;
  explorerUrl: string;
  isTestnet: boolean;
}

export const NETWORKS: Record<number, NetworkConfig> = {
  1: {
    chainId: 1,
    name: 'mainnet',
    enscribeChainName: 'mainnet',
    sourcifyChainId: 1,
    ensParent: 'contractid.eth',
    rpcUrlEnvKey: 'RPC_URL_MAINNET',
    explorerUrl: 'https://etherscan.io',
    isTestnet: false,
  },
  11155111: {
    chainId: 11155111,
    name: 'sepolia',
    enscribeChainName: 'sepolia',
    sourcifyChainId: 11155111,
    ensParent: 'hallmarked.eth',
    rpcUrlEnvKey: 'RPC_URL_SEPOLIA',
    explorerUrl: 'https://sepolia.etherscan.io',
    isTestnet: true,
  },
  8453: {
    chainId: 8453,
    name: 'base',
    enscribeChainName: 'base',
    sourcifyChainId: 8453,
    ensParent: 'contractid.base.eth',
    rpcUrlEnvKey: 'RPC_URL_BASE',
    explorerUrl: 'https://basescan.org',
    isTestnet: false,
  },
  84532: {
    chainId: 84532,
    name: 'base-sepolia',
    enscribeChainName: 'base-sepolia',
    sourcifyChainId: 84532,
    ensParent: 'contractid.basetest.eth',
    rpcUrlEnvKey: 'RPC_URL_BASE_SEPOLIA',
    explorerUrl: 'https://sepolia.basescan.org',
    isTestnet: true,
  },
  10: {
    chainId: 10,
    name: 'optimism',
    enscribeChainName: 'optimism',
    sourcifyChainId: 10,
    ensParent: 'contractid.eth',
    rpcUrlEnvKey: 'RPC_URL_OPTIMISM',
    explorerUrl: 'https://optimistic.etherscan.io',
    isTestnet: false,
  },
  42161: {
    chainId: 42161,
    name: 'arbitrum',
    enscribeChainName: 'arbitrum',
    sourcifyChainId: 42161,
    ensParent: 'contractid.eth',
    rpcUrlEnvKey: 'RPC_URL_ARBITRUM',
    explorerUrl: 'https://arbiscan.io',
    isTestnet: false,
  },
  59144: {
    chainId: 59144,
    name: 'linea',
    enscribeChainName: 'linea',
    sourcifyChainId: 59144,
    ensParent: 'contractid.linea.eth',
    rpcUrlEnvKey: 'RPC_URL_LINEA',
    explorerUrl: 'https://lineascan.build',
    isTestnet: false,
  },
};

export const DEFAULT_DEMO_CHAIN_ID = 11155111;

export function getNetwork(chainId: number): NetworkConfig {
  const n = NETWORKS[chainId];
  if (!n) throw new Error(`Unsupported chainId: ${chainId}`);
  return n;
}

export function isSupportedChain(chainId: number): boolean {
  return chainId in NETWORKS;
}

export const SUPPORTED_CHAIN_IDS = Object.keys(NETWORKS).map(Number);
