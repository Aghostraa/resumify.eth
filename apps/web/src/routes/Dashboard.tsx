import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { DeveloperResume } from '../types';
import SearchBar from '../components/SearchBar';
import ProfileCard from '../components/ProfileCard';
import StatsRow from '../components/StatsRow';
import ContractsTable from '../components/ContractsTable';
import ChainPicker from '../components/ChainPicker';
import { fetchResume } from '../api/client';
import { useWalletContext } from '../contexts/WalletContext';

const DEFAULT_BLOCKSCOUT_CHAINS = [11155111];

type AppState = 'idle' | 'loading' | 'loaded' | 'error';

export default function Dashboard() {
  const navigate = useNavigate();
  const wallet = useWalletContext();
  const [state, setState] = useState<AppState>('idle');
  const [resume, setResume] = useState<DeveloperResume | null>(null);
  const [error, setError] = useState<string>('');
  const [lastQuery, setLastQuery] = useState('');
  const [selectedChains, setSelectedChains] = useState<number[] | null>(null);
  const autoLoadedRef = useRef<string | null>(null);

  // Auto-load portfolio when wallet connects
  useEffect(() => {
    if (wallet.address && autoLoadedRef.current !== wallet.address && state === 'idle') {
      autoLoadedRef.current = wallet.address;
      void search(wallet.address);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet.address]);

  async function search(query: string, chains = selectedChains) {
    setState('loading');
    setError('');
    setLastQuery(query);
    try {
      const data = await fetchResume(query, chains ?? DEFAULT_BLOCKSCOUT_CHAINS);
      setResume(data);
      setState('loaded');
    } catch (err) {
      setState('error');
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  function handleChainsChange(chains: number[] | null) {
    setSelectedChains(chains);
    if (lastQuery && state === 'loaded') void search(lastQuery, chains);
  }

  function handleContractVerified(address: string, chainId: number) {
    setResume((prev) => {
      if (!prev) return prev;
      const deployments = prev.deployments.map((d) =>
        d.address === address && d.chainId === chainId ? { ...d, verified: true } : d,
      );
      const verifiedDeployments = deployments.filter((d) => d.verified).length;
      return {
        ...prev,
        deployments,
        stats: {
          ...prev.stats,
          verifiedDeployments,
          verificationRate: deployments.length > 0 ? verifiedDeployments / deployments.length : 0,
        },
      };
    });
  }

  function openAnalyzer(address: string, chainId: number) {
    navigate(`/c/${chainId}/${address}`);
  }

  const chainCount = selectedChains === null ? DEFAULT_BLOCKSCOUT_CHAINS.length : selectedChains.length;

  if (state === 'idle') {
    return (
      <section className="flex flex-col items-center text-center px-6 md:px-12 pt-20 pb-16">
        {/* Eyebrow */}
        <div className="flex items-center gap-2 mb-8 animate-fade-up">
          <div className="hm-eyebrow-dot animate-eyebrow-pulse" />
          <div className="text-[10px] font-light tracking-[0.32em] uppercase text-white/30">
            Live on Ethereum Sepolia
          </div>
        </div>

        {/* Headline */}
        <h1
          className="font-display font-extralight tracking-[0.04em] leading-[1.08] text-white mb-5 max-w-[820px] animate-fade-up"
          style={{ fontSize: 'clamp(36px, 6vw, 76px)', animationDelay: '0.1s', animationFillMode: 'both', opacity: 0 }}
        >
          Your onchain work,<br />
          <em className="not-italic text-white/[0.28]">scored and identified</em>
        </h1>

        {/* Sub */}
        <p
          className="font-light tracking-[0.04em] leading-[1.7] text-white/30 max-w-[520px] mb-12 animate-fade-up"
          style={{ fontSize: 'clamp(13px, 1.6vw, 16px)', animationDelay: '0.2s', animationFillMode: 'both', opacity: 0 }}
        >
          Search any address or ENS name. Hallmark surfaces every contract you've deployed across
          100+ chains, scores each one with AI security analysis, and mints a permanent ENS identity — in seconds.
        </p>

        {/* Search */}
        <div
          className="w-full max-w-[640px] flex flex-col gap-3 mb-12 animate-fade-up"
          style={{ animationDelay: '0.3s', animationFillMode: 'both', opacity: 0 }}
        >
          <SearchBar onSearch={search} loading={false} />
          <div className="flex items-center justify-between gap-3 px-1">
            <div className="text-[9px] font-light tracking-[0.22em] uppercase text-white/[0.14]">
              Try —{' '}
              <span
                onClick={() => void search('vitalik.eth')}
                className="text-white/30 cursor-pointer hover:text-white/60 transition-colors"
              >
                vitalik.eth
              </span>{' '}
              ·{' '}
              <span
                onClick={() => void search('nick.eth')}
                className="text-white/30 cursor-pointer hover:text-white/60 transition-colors"
              >
                nick.eth
              </span>
            </div>
            <ChainPicker selected={selectedChains} onChange={handleChainsChange} />
          </div>
        </div>

        {/* Stats */}
        <div
          className="w-full max-w-[820px] flex items-center border border-white/[0.07] rounded-[10px] overflow-hidden animate-fade-up"
          style={{ animationDelay: '0.4s', animationFillMode: 'both', opacity: 0 }}
        >
          <StatCell value="27M+" label="Verified Contracts" />
          <StatCell value="100+" label="EVM Chains" />
          <StatCell value="ENS" label="Identity Layer" />
        </div>

      </section>
    );
  }

  return (
    <section className="px-6 md:px-12 py-12 max-w-[1100px] mx-auto space-y-8">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <SearchBar onSearch={search} loading={state === 'loading'} />
        </div>
        <ChainPicker selected={selectedChains} onChange={handleChainsChange} />
      </div>

      {state === 'loading' && (
        <div className="flex flex-col items-center justify-center py-24 space-y-3 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 bg-hm-green rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              ))}
            </div>
            <span className="text-[10px] font-light tracking-[0.22em] uppercase text-white/40">
              Fetching resume…
            </span>
          </div>
          <p className="text-[9px] font-light tracking-[0.22em] uppercase text-white/[0.18]">
            BigQuery (verified) + Blockscout ({chainCount} chain{chainCount !== 1 ? 's' : ''})
          </p>
        </div>
      )}

      {state === 'error' && (
        <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
          <div className="bg-[rgba(255,69,58,0.07)] border border-[rgba(255,69,58,0.25)] rounded-[10px] p-6 text-center max-w-md">
            <p className="text-[10px] font-light tracking-[0.22em] uppercase text-hm-red mb-2">Lookup failed</p>
            <p className="font-mono text-xs text-hm-red/70">{error}</p>
            <button
              onClick={() => setState('idle')}
              className="mt-4 text-[10px] font-light tracking-[0.22em] uppercase text-white/40 hover:text-white transition-colors"
            >
              ← Try again
            </button>
          </div>
        </div>
      )}

      {state === 'loaded' && resume && (
        <>
          <ProfileCard resume={resume} />
          <StatsRow stats={resume.stats} />
          <ContractsTable
            deployments={resume.deployments}
            onContractVerified={handleContractVerified}
            onOpenAnalyzer={openAnalyzer}
            wallet={wallet}
          />
        </>
      )}
    </section>
  );
}

function StatCell({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex-1 px-7 py-5 flex flex-col items-center gap-1.5 border-r border-white/[0.07] last:border-r-0">
      <div className="font-display font-extralight text-xl tracking-[0.04em] text-white">{value}</div>
      <div className="text-[9px] font-light tracking-[0.26em] uppercase text-white/[0.22]">{label}</div>
    </div>
  );
}
