import { useState } from 'react';
import { nameContract } from '@enscribe/enscribe';
import { createPublicClient, http } from 'viem';
import { sepolia } from 'viem/chains';
import type { WalletState } from '../hooks/useWallet';

interface Props {
  contractAddress: string;
  chainId: number;
  contractName?: string | null;
  wallet: WalletState;
}

const NAMESPACE = 'hallmarked.eth';

export default function EnscribeButton({ contractAddress, chainId, contractName, wallet }: Props) {
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle');
  const [ensName, setEnsName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (chainId !== 11155111) return null; // only Sepolia for now

  async function handleEnscribe() {
    if (!wallet.walletClient || !wallet.address) {
      await wallet.connect();
      return;
    }
    setState('busy');
    setError(null);
    try {
      const slug = (contractName ?? contractAddress.slice(2, 8)).toLowerCase().replace(/[^a-z0-9-]/g, '');
      const label = `${contractAddress.slice(2, 8).toLowerCase()}-${slug || 'contract'}`;
      const name = `${label}.${NAMESPACE}`;

      const result = await nameContract({
        name,
        contractAddress,
        walletClient: wallet.walletClient as never,
        chainName: 'sepolia',
      });

      setEnsName(result.name);
      setState('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Enscribe failed');
      setState('error');
    }
  }

  if (state === 'done' && ensName) {
    return (
      <a
        href={`https://app.ens.domains/${ensName}`}
        target="_blank"
        rel="noopener noreferrer"
        className="font-mono text-xs px-2.5 py-1 rounded border border-acid-400/50 text-acid-400 hover:border-acid-400 transition-colors"
        title={ensName}
      >
        ✓ {ensName.split('.')[0]}
      </a>
    );
  }

  if (state === 'error') {
    return (
      <button
        onClick={() => setState('idle')}
        className="font-mono text-xs px-2.5 py-1 rounded border border-rose-400/50 text-rose-400 hover:border-rose-400 transition-colors"
        title={error ?? 'failed'}
      >
        ✗ retry
      </button>
    );
  }

  return (
    <button
      onClick={handleEnscribe}
      disabled={state === 'busy'}
      className="font-mono text-xs px-2.5 py-1 rounded border border-ink-600 text-ink-400 hover:border-acid-400 hover:text-acid-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      title="Name this contract on ENS via Enscribe"
    >
      {state === 'busy' ? '…' : 'enscribe →'}
    </button>
  );
}
