import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { DeveloperResume } from '../types';
import SearchBar from '../components/SearchBar';
import ProfileCard from '../components/ProfileCard';
import StatsRow from '../components/StatsRow';
import ContractsTable from '../components/ContractsTable';
import ChainPicker from '../components/ChainPicker';
import { fetchResume } from '../api/client';

const DEFAULT_BLOCKSCOUT_CHAINS = [1, 10, 56, 100, 137, 324, 8453, 42161, 42220, 43114];

type AppState = 'idle' | 'loading' | 'loaded' | 'error';

export default function Dashboard() {
  const navigate = useNavigate();
  const [state, setState] = useState<AppState>('idle');
  const [resume, setResume] = useState<DeveloperResume | null>(null);
  const [error, setError] = useState<string>('');
  const [lastQuery, setLastQuery] = useState('');
  const [selectedChains, setSelectedChains] = useState<number[] | null>(null);

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

  return (
    <>
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <SearchBar onSearch={search} loading={state === 'loading'} />
        </div>
        <ChainPicker selected={selectedChains} onChange={handleChainsChange} />
      </div>

      {state === 'idle' && (
        <div className="flex flex-col items-center justify-center py-24 space-y-4 animate-fade-in">
          <div className="text-center space-y-2">
            <h1 className="font-mono text-4xl font-semibold text-gradient">contractid</h1>
            <p className="font-mono text-sm text-ink-500">
              onchain identity for smart contracts · ENS · Sourcify · OLI · EthGuard
            </p>
          </div>
          <p className="font-mono text-xs text-ink-600">
            try <span className="text-ink-400">vitalik.eth</span> for deployer view, or{' '}
            <a href="/analyze" className="text-acid-400 hover:underline">analyze a contract</a>
          </p>
        </div>
      )}

      {state === 'loading' && (
        <div className="flex flex-col items-center justify-center py-24 space-y-3 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div key={i} className="w-2 h-2 bg-acid-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
              ))}
            </div>
            <span className="font-mono text-sm text-ink-500">fetching resume…</span>
          </div>
          <p className="font-mono text-xs text-ink-600">
            BigQuery (verified) + Blockscout ({chainCount} chain{chainCount !== 1 ? 's' : ''})
          </p>
        </div>
      )}

      {state === 'error' && (
        <div className="flex flex-col items-center justify-center py-24 animate-fade-in">
          <div className="bg-rose-400/10 border border-rose-400/30 rounded-lg p-6 text-center max-w-md">
            <p className="font-mono text-rose-400 text-sm mb-1">lookup failed</p>
            <p className="font-mono text-xs text-rose-400/70">{error}</p>
            <button onClick={() => setState('idle')} className="mt-4 font-mono text-xs text-ink-400 hover:text-ink-100 transition-colors">
              ← try again
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
          />
        </>
      )}
    </>
  );
}
