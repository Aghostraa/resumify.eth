import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import ContractInput from '../components/ContractInput';
import AnalysisProgress from '../components/AnalysisProgress';
import IdentityCard from '../components/IdentityCard';
import { analyzeContract, fetchAgentIdentity } from '../api/client';
import type { AgentInfo, AnalyzerResult } from '../types';

export default function Analyzer() {
  const params = useParams<{ chainId?: string; address?: string }>();
  const [result, setResult] = useState<AnalyzerResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agent, setAgent] = useState<AgentInfo | null>(null);

  useEffect(() => {
    fetchAgentIdentity().then(setAgent).catch(() => setAgent(null));
  }, []);

  // Auto-run when navigated with /c/:chainId/:address
  useEffect(() => {
    if (params.address && params.chainId) {
      void onSubmit({ address: params.address, chainId: Number(params.chainId) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.address, params.chainId]);

  async function onSubmit(input: { address?: string; sourceCode?: string; chainId: number }) {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await analyzeContract(input);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-xl text-ink-100">Analyzer</h2>
        <p className="text-xs text-ink-500">
          Score any contract via Sourcify + Claude + EthGuard, name it under ENS, attest to OLI on Base.
        </p>
        {agent?.ensName && (
          <div className="text-xs text-ink-500">
            agent: <a href={agent.ensProfileUrl ?? '#'} target="_blank" rel="noreferrer" className="text-acid-400 hover:underline">{agent.ensName}</a>
            {' · '}model: {agent.model}
          </div>
        )}
      </div>

      <ContractInput
        onSubmit={onSubmit}
        disabled={loading}
        initialAddress={params.address ?? ''}
        initialChainId={params.chainId ? Number(params.chainId) : 11155111}
      />

      {loading && <AnalysisProgress />}

      {error && (
        <div className="mt-8 p-4 border border-rose-400/40 bg-rose-400/10 rounded text-rose-300 text-sm">
          {error}
        </div>
      )}

      {result && <IdentityCard result={result} />}
    </div>
  );
}
