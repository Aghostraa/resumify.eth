import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import ContractInput from '../components/ContractInput';
import AnalysisProgress from '../components/AnalysisProgress';
import IdentityCard from '../components/IdentityCard';
import { analyzeContractStream, fetchAgentIdentity } from '../api/client';
import type { AgentInfo, AnalyzerResult, PipelineStep } from '../types';

interface CachedData {
  ensName: string;
  records: Record<string, string>;
}

export default function Analyzer() {
  const params = useParams<{ chainId?: string; address?: string }>();
  const [result, setResult] = useState<AnalyzerResult | null>(null);
  const [cached, setCached] = useState<CachedData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agent, setAgent] = useState<AgentInfo | null>(null);
  const [steps, setSteps] = useState<PipelineStep[]>([]);

  useEffect(() => {
    fetchAgentIdentity().then(setAgent).catch(() => setAgent(null));
  }, []);

  useEffect(() => {
    if (params.address && params.chainId) {
      void onSubmit({ address: params.address, chainId: Number(params.chainId) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.address, params.chainId]);

  async function onSubmit(input: { address?: string; sourceCode?: string; chainId: number; force?: boolean }) {
    setLoading(true);
    setError(null);
    setResult(null);
    setCached(null);
    setSteps([]);
    try {
      const data = await analyzeContractStream(
        input,
        (step) => setSteps((prev) => [...prev, step]),
        (cachedData) => setCached(cachedData),
      );
      if (data) setResult(data);
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
            agent:{' '}
            <a href={agent.ensProfileUrl ?? '#'} target="_blank" rel="noreferrer" className="text-acid-400 hover:underline">
              {agent.ensName}
            </a>
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

      {loading && <AnalysisProgress completedSteps={steps} />}

      {error && (
        <div className="mt-8 p-4 border border-rose-400/40 bg-rose-400/10 rounded text-rose-300 text-sm font-mono">
          {error}
        </div>
      )}

      {cached && !result && (
        <CachedCard
          data={cached}
          onReanalyze={() => {
            if (params.address) void onSubmit({ address: params.address, chainId: Number(params.chainId ?? 11155111), force: true });
          }}
        />
      )}

      {result && <IdentityCard result={result} />}
    </div>
  );
}

function CachedCard({ data, onReanalyze }: { data: CachedData; onReanalyze: () => void }) {
  const r = data.records;
  const score = r['trust-score'];
  const pattern = r['pattern'];
  const verified = r['sourcify-verified'];
  const flags = r['risk-flags'];
  const description = r['description'];
  const classifiedAt = r['classified-at'];

  return (
    <div className="mt-6 border border-acid-500/30 bg-acid-500/5 rounded-lg p-5 space-y-4 animate-fade-in font-mono">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-acid-500" />
          <span className="text-xs text-acid-400">cached · hallmarked.eth</span>
        </div>
        <button
          onClick={onReanalyze}
          className="text-xs text-ink-500 hover:text-ink-200 transition-colors border border-ink-700 px-2.5 py-1 rounded"
        >
          re-analyze →
        </button>
      </div>

      <div className="flex items-baseline gap-3">
        <a
          href={`https://app.ens.domains/${data.ensName}`}
          target="_blank"
          rel="noreferrer"
          className="text-lg text-acid-300 hover:underline"
        >
          {data.ensName}
        </a>
        {classifiedAt && (
          <span className="text-xs text-ink-600">
            {new Date(classifiedAt).toLocaleDateString()}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        {score && (
          <div className="bg-ink-800 rounded p-3">
            <div className="text-ink-500 mb-1">trust score</div>
            <div className="text-ink-100">{score}</div>
          </div>
        )}
        {pattern && (
          <div className="bg-ink-800 rounded p-3">
            <div className="text-ink-500 mb-1">pattern</div>
            <div className="text-ink-100">{pattern}</div>
          </div>
        )}
        {verified && (
          <div className="bg-ink-800 rounded p-3">
            <div className="text-ink-500 mb-1">sourcify</div>
            <div className={verified === 'true' ? 'text-acid-400' : verified === 'partial' ? 'text-yellow-400' : 'text-rose-400'}>
              {verified}
            </div>
          </div>
        )}
        {flags && flags !== 'none' && (
          <div className="bg-ink-800 rounded p-3">
            <div className="text-ink-500 mb-1">risk flags</div>
            <div className="text-rose-300">{flags}</div>
          </div>
        )}
      </div>

      {description && (
        <p className="text-xs text-ink-400 leading-relaxed border-t border-ink-700 pt-3">
          {description}
        </p>
      )}
    </div>
  );
}
