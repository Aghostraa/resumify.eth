import { useState } from 'react';
import type { DeveloperResume } from './types';
import SearchBar from './components/SearchBar';
import ProfileCard from './components/ProfileCard';
import StatsRow from './components/StatsRow';
import ContractsTable from './components/ContractsTable';
import ChainPicker from './components/ChainPicker';

// Mirrors DEFAULT_BLOCKSCOUT_CHAINS in src/index.ts
const DEFAULT_BLOCKSCOUT_CHAINS = [1, 10, 56, 137, 8453, 42161, 324, 100, 42220, 43114];

type AppState = 'idle' | 'loading' | 'loaded' | 'error';

export default function App() {
  const [state, setState] = useState<AppState>('idle');
  const [resume, setResume] = useState<DeveloperResume | null>(null);
  const [error, setError] = useState<string>('');
  const [lastQuery, setLastQuery] = useState('');
  // null = default (top 10 chains), number[] = custom selection for unverified scan
  const [selectedChains, setSelectedChains] = useState<number[] | null>(null);

  async function search(query: string, chains = selectedChains) {
    setState('loading');
    setError('');
    setLastQuery(query);

    const chainIds = chains ?? DEFAULT_BLOCKSCOUT_CHAINS;
    const params = new URLSearchParams({ chains: chainIds.join(',') });

    try {
      const res = await fetch(`/api/resume/${encodeURIComponent(query)}?${params}`);
      const data = await res.json() as DeveloperResume & { error?: string };

      if (!res.ok) {
        setState('error');
        setError(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setResume(data);
      setState('loaded');
    } catch (err) {
      setState('error');
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  function handleChainsChange(chains: number[] | null) {
    setSelectedChains(chains);
    // Re-search if already loaded
    if (lastQuery && state === 'loaded') search(lastQuery, chains);
  }

  function handleContractVerified(address: string, chainId: number) {
    setResume((prev) => {
      if (!prev) return prev;
      const deployments = prev.deployments.map((d) =>
        d.address === address && d.chainId === chainId ? { ...d, verified: true } : d
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

  const chainCount = selectedChains === null
    ? DEFAULT_BLOCKSCOUT_CHAINS.length
    : selectedChains.length;

  return (
    <div className="min-h-screen bg-ink-950 border-grid">
      {/* Header */}
      <header className="border-b border-ink-700/50 bg-ink-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-2 h-2 rounded-full bg-acid-500 glow-green" />
            <span className="font-mono font-semibold text-ink-100">resumify</span>
            <span className="font-mono text-xs text-ink-600">v0.1</span>
          </div>
          <div className="flex-1 min-w-0">
            <SearchBar onSearch={search} loading={state === 'loading'} />
          </div>
          <ChainPicker selected={selectedChains} onChange={handleChainsChange} />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-5">
        {state === 'idle' && (
          <div className="flex flex-col items-center justify-center py-24 space-y-4 animate-fade-in">
            <div className="text-center space-y-2">
              <h1 className="font-mono text-4xl font-semibold text-gradient">resumify</h1>
              <p className="font-mono text-sm text-ink-500">onchain developer resume · ENS · Blockscout · Sourcify</p>
            </div>
            <p className="font-mono text-xs text-ink-600">
              try <span className="text-ink-400">vitalik.eth</span> or any deployer address
            </p>
          </div>
        )}

        {state === 'loading' && (
          <div className="flex flex-col items-center justify-center py-24 space-y-3 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="w-2 h-2 bg-acid-500 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 150}ms` }} />
                ))}
              </div>
              <span className="font-mono text-sm text-ink-500">fetching resume…</span>
            </div>
            <p className="font-mono text-xs text-ink-600">
              BigQuery (all chains, verified) + Blockscout ({chainCount} chain{chainCount !== 1 ? 's' : ''}, unverified)
            </p>
          </div>
        )}

        {state === 'error' && (
          <div className="flex flex-col items-center justify-center py-24 animate-fade-in">
            <div className="bg-rose-400/10 border border-rose-400/30 rounded-lg p-6 text-center max-w-md">
              <p className="font-mono text-rose-400 text-sm mb-1">lookup failed</p>
              <p className="font-mono text-xs text-rose-400/70">{error}</p>
              <button onClick={() => setState('idle')}
                className="mt-4 font-mono text-xs text-ink-400 hover:text-ink-100 transition-colors">
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
            />
          </>
        )}
      </main>

      <footer className="border-t border-ink-700/50 mt-16 py-4 text-center">
        <p className="font-mono text-xs text-ink-700">
          resumify · ETHPrague 2026 ·{' '}
          <a href="https://github.com/Aghostraa/resumify.eth" target="_blank" rel="noopener noreferrer"
            className="hover:text-ink-500 transition-colors">
            github
          </a>
        </p>
      </footer>
    </div>
  );
}
