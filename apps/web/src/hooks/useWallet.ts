import { useState, useCallback } from 'react';
import { createWalletClient, createPublicClient, custom, http } from 'viem';
import { sepolia } from 'viem/chains';

export interface WalletState {
  address: string | null;
  walletClient: ReturnType<typeof createWalletClient> | null;
  publicClient: ReturnType<typeof createPublicClient>;
  connecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(),
});

export function useWallet(): WalletState {
  const [address, setAddress] = useState<string | null>(null);
  const [walletClient, setWalletClient] = useState<ReturnType<typeof createWalletClient> | null>(null);
  const [connecting, setConnecting] = useState(false);

  const connect = useCallback(async () => {
    const eth = (window as unknown as { ethereum?: { request: (args: { method: string }) => Promise<string[]> } }).ethereum;
    if (!eth) { alert('No wallet found. Install MetaMask.'); return; }
    setConnecting(true);
    try {
      const accounts = await eth.request({ method: 'eth_requestAccounts' });
      const client = createWalletClient({ chain: sepolia, transport: custom(eth) });
      setAddress(accounts[0]);
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
