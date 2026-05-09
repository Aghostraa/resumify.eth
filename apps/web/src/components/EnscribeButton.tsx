import { useState } from 'react';
import { nameContract } from '@enscribe/enscribe';
import { getAddress } from 'viem';
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

  if (chainId !== 11155111) return null;

  async function handleEnscribe() {
    if (!wallet.walletClient || !wallet.address) {
      await wallet.connect();
      return;
    }
    setState('busy');
    setError(null);
    try {
      const eth = (window as unknown as { ethereum?: { request: (a: { method: string; params?: unknown[] }) => Promise<unknown> } }).ethereum;
      if (eth) {
        const currentChain = await eth.request({ method: 'eth_chainId' }) as string;
        if (parseInt(currentChain, 16) !== 11155111) {
          await eth.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0xaa36a7' }] });
        }
      }

      const slug = (contractName ?? contractAddress.slice(2, 8)).toLowerCase().replace(/[^a-z0-9-]/g, '');
      const label = `${contractAddress.slice(2, 8).toLowerCase()}-${slug || 'contract'}`;
      const name = `${label}.${NAMESPACE}`;

      const result = await nameContract({
        name,
        contractAddress: getAddress(contractAddress),
        walletClient: wallet.walletClient,
        chainName: 'sepolia',
      });

      setEnsName(result.name);
      setState('done');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[Enscribe]', err);
      setError(msg);
      setState('error');
    }
  }

  if (state === 'done' && ensName) {
    return (
      <a
        href={`https://app.ens.domains/${ensName}`}
        target="_blank"
        rel="noopener noreferrer"
        title={ensName}
        className="w-7 h-7 flex items-center justify-center rounded-md border border-hm-green/40 text-hm-green hover:border-hm-green/60 transition-colors"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
      </a>
    );
  }

  if (state === 'error') {
    return (
      <button
        onClick={() => setState('idle')}
        title={error ?? 'failed — click to retry'}
        className="w-7 h-7 flex items-center justify-center rounded-md border border-hm-red/40 text-hm-red hover:border-hm-red/60 transition-colors"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
      </button>
    );
  }

  return (
    <button
      onClick={handleEnscribe}
      disabled={state === 'busy'}
      title="Name this contract on ENS"
      className="w-7 h-7 flex items-center justify-center rounded-md border border-white/[0.18] text-white/30 hover:border-white/25 hover:text-white/70 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
    >
      {state === 'busy'
        ? <span className="text-[9px]">…</span>
        : <EnsIcon />
      }
    </button>
  );
}

function EnsIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12h8M12 8v8" />
    </svg>
  );
}
