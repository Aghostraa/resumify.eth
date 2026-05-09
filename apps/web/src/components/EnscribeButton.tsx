import { useState } from 'react';

interface Props {
  contractAddress: string;
  chainId: number;
  developerAddress?: string;
  onMinted?: (ensName: string) => void;
}

export default function EnscribeButton({ contractAddress, chainId, developerAddress, onMinted }: Props) {
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle');
  const [ensName, setEnsName] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  if (chainId !== 11155111) return null;

  async function handleMint() {
    setState('busy');
    setError(null);
    setProgress('starting…');

    const params = new URLSearchParams({
      address: contractAddress,
      chainId: String(chainId),
      force: 'false',
      ...(developerAddress ? { developer: developerAddress } : {}),
    });

    try {
      const es = new EventSource(`/api/analyze/stream?${params}`);

      es.addEventListener('step', (e) => {
        const data = JSON.parse(e.data) as { step: string; ok: boolean; detail?: string };
        setProgress(data.step);
      });

      es.addEventListener('result', (e) => {
        const data = JSON.parse(e.data) as { ens?: { name: string } | null };
        es.close();
        if (data.ens?.name) {
          setEnsName(data.ens.name);
          setState('done');
          onMinted?.(data.ens.name);
        } else {
          setError('no ENS name minted — contract may not be verified');
          setState('error');
        }
      });

      es.addEventListener('cached', (e) => {
        const data = JSON.parse(e.data) as { ensName?: string };
        es.close();
        if (data.ensName) {
          setEnsName(data.ensName);
          setState('done');
          onMinted?.(data.ensName);
        } else {
          setState('idle');
        }
      });

      es.addEventListener('error', (e) => {
        const data = (e as MessageEvent).data ? JSON.parse((e as MessageEvent).data) as { error?: string } : {};
        es.close();
        setError(data.error ?? 'pipeline failed');
        setState('error');
      });

      es.onerror = () => {
        es.close();
        if (state === 'busy') {
          setError('connection lost');
          setState('error');
        }
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setState('error');
    }
  }

  if (state === 'done' && ensName) {
    return (
      <a
        href={`https://sepolia.app.ens.domains/${ensName}`}
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
      onClick={handleMint}
      disabled={state === 'busy'}
      title={state === 'busy' ? `${progress}` : developerAddress ? 'Score & add to resume' : 'Score & name on ENS'}
      className="w-7 h-7 flex items-center justify-center rounded-md border border-white/[0.18] text-white/30 hover:border-white/25 hover:text-white/70 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
    >
      {state === 'busy'
        ? <span className="text-[7px] font-mono animate-pulse">{progress.slice(0, 4) || '…'}</span>
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
