import { useState, useCallback } from 'react';
import { createWalletClient, createPublicClient, custom, http, fallback, type WalletClient } from 'viem';
import { sepolia } from 'viem/chains';

const SEPOLIA_RPC_FALLBACKS = [
  'https://sepolia.drpc.org',
  'https://rpc.ankr.com/eth_sepolia',
  'https://ethereum-sepolia-rpc.publicnode.com',
];

export interface WalletState {
  address: `0x${string}` | null;
  walletClient: WalletClient | null;
  publicClient: ReturnType<typeof createPublicClient>;
  connecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const publicClient = createPublicClient({
  chain: sepolia,
  transport: fallback(SEPOLIA_RPC_FALLBACKS.map((url) => http(url))),
});

export function useWallet(): WalletState {
  const [address, setAddress] = useState<`0x${string}` | null>(null);
  const [walletClient, setWalletClient] = useState<WalletClient | null>(null);
  const [connecting, setConnecting] = useState(false);

  const connect = useCallback(async () => {
    const eth = (window as unknown as { ethereum?: { request: (args: { method: string }) => Promise<string[]> } }).ethereum;
    if (!eth) { alert('No wallet found. Install MetaMask.'); return; }
    setConnecting(true);
    try {
      const accounts = await eth.request({ method: 'eth_requestAccounts' });
      const account = accounts[0] as `0x${string}`;
      const client = createWalletClient({
        account,
        chain: sepolia,
        transport: fallback([custom(eth), ...SEPOLIA_RPC_FALLBACKS.map((url) => http(url))]),
      });
      setAddress(account);
      setWalletClient(client);
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
    setWalletClient(null);
  }, []);

  return { address, walletClient, publicClient, connecting, connect, disconnect };
}
