import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import ContractInput from '../components/ContractInput';
import AnalysisProgress from '../components/AnalysisProgress';
import IdentityCard from '../components/IdentityCard';
import { analyzeContractStream, fetchAgentIdentity } from '../api/client';
import { useWalletContext } from '../contexts/WalletContext';
import type { AgentInfo, AnalyzerResult, PipelineStep } from '../types';

interface CachedData {
  ensName: string;
  records: Record<string, string>;
}

export default function Analyzer() {
  const params = useParams<{ chainId?: string; address?: string }>();
  const wallet = useWalletContext();
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
        { ...input, developer: wallet.address ?? undefined },
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
    <section className="px-6 md:px-12 pt-16 pb-16 max-w-[1100px] mx-auto">
      {/* Hero */}
      <div className="flex flex-col items-center text-center mb-12">
        <div className="flex items-center gap-2 mb-8 animate-fade-up">
          <div className="hm-eyebrow-dot animate-eyebrow-pulse" />
          <div className="text-[10px] font-light tracking-[0.32em] uppercase text-white/55">
            Contract Identity Layer
          </div>
        </div>
        <h1
          className="font-display font-extralight tracking-[0.04em] leading-[1.08] text-white mb-5 max-w-[820px] animate-fade-up"
          style={{ fontSize: 'clamp(36px, 6vw, 76px)', animationDelay: '0.1s', animationFillMode: 'both', opacity: 0 }}
        >
          Every contract<br />
          <em className="not-italic text-white/[0.28]">deserves</em> an identity
        </h1>
        <p
          className="font-light tracking-[0.04em] leading-[1.7] text-white/55 max-w-[560px] animate-fade-up"
          style={{ fontSize: 'clamp(13px, 1.6vw, 16px)', animationDelay: '0.2s', animationFillMode: 'both', opacity: 0 }}
        >
          Paste any contract address. Hallmark verifies it against Sourcify, classifies it with Claude,
          runs EthGuard security heuristics, attests the result to OLI on Base, and mints a permanent
          ENS identity — all in a single pass.
        </p>
        {agent?.ensName && (
          <div
            className="mt-6 text-[10px] font-light tracking-[0.22em] uppercase text-white/40 animate-fade-up"
            style={{ animationDelay: '0.3s', animationFillMode: 'both', opacity: 0 }}
          >
            Agent:{' '}
            <a
              href={agent.ensProfileUrl ?? '#'}
              target="_blank"
              rel="noreferrer"
              className="text-hm-green hover:underline"
            >
              {agent.ensName}
            </a>
            <span className="text-white/20"> · </span>
            Model: {agent.model}
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
        <div className="mt-8 p-5 hm-card border-[rgba(255,69,58,0.25)]" style={{ background: 'rgba(255,69,58,0.05)' }}>
          <div className="text-[10px] font-light tracking-[0.22em] uppercase text-hm-red mb-1.5">Error</div>
          <div className="font-mono text-xs text-hm-red/80">{error}</div>
        </div>
      )}

      {cached && !result && (
        <CachedCard
          data={cached}
          onReanalyze={() => {
            if (params.address)
              void onSubmit({ address: params.address, chainId: Number(params.chainId ?? 11155111), force: true });
          }}
          developerAddress={wallet.address ?? undefined}
        />
      )}

      {result && <IdentityCard result={result} />}
    </section>
  );
}

function CachedCard({ data, onReanalyze, developerAddress }: { data: CachedData; onReanalyze: () => void; developerAddress?: string }) {
  const r = data.records;
  const score = r['trust-score'];
  const pattern = r['pattern'];
  const verified = r['sourcify-verified'];
  const flags = r['risk-flags'];
  const description = r['description'];
  const classifiedAt = r['classified-at'];

  return (
    <div
      className="mt-8 hm-card p-6 space-y-5 animate-fade-up"
      style={{ borderColor: 'rgba(48,209,88,0.20)' }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="hm-eyebrow-dot" />
          <span className="text-[10px] font-light tracking-[0.22em] uppercase text-hm-green">
            Cached · hallmarked.eth
          </span>
        </div>
        <button
          onClick={onReanalyze}
          className="text-[10px] tracking-[0.22em] uppercase text-white/40 hover:text-white border border-white/[0.18] hover:border-white/30 px-3 py-1.5 rounded-full transition-colors"
          title={developerAddress ? 'Re-analyze and mint under your resume namespace' : 'Re-analyze'}
        >
          {developerAddress ? 'Mint to resume →' : 'Re-analyze →'}
        </button>
      </div>

      <div className="flex items-baseline gap-3 flex-wrap">
        <a
          href={`https://sepolia.app.ens.domains/${data.ensName}`}
          target="_blank"
          rel="noreferrer"
          className="font-mono text-lg text-hm-green hover:underline tracking-[0.02em]"
        >
          {data.ensName}
        </a>
        {classifiedAt && (
          <span className="font-mono text-[10px] text-white/30">
            {new Date(classifiedAt).toLocaleDateString()}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 border border-white/[0.18] rounded-lg overflow-hidden">
        {score && <CachedField label="Trust Score" value={score} accent="green" />}
        {pattern && <CachedField label="Pattern" value={pattern} />}
        {verified && (
          <CachedField
            label="Sourcify"
            value={verified}
            accent={verified === 'true' ? 'green' : verified === 'partial' ? 'amber' : 'red'}
          />
        )}
        {flags && flags !== 'none' && <CachedField label="Risk Flags" value={flags} accent="amber" />}
      </div>

      {description && (
        <p className="text-xs text-white/55 leading-relaxed border-t border-white/[0.18] pt-4">
          {description}
        </p>
      )}
    </div>
  );
}

function CachedField({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: 'green' | 'red' | 'amber' | 'blue';
}) {
  const color =
    accent === 'green'
      ? 'text-hm-green'
      : accent === 'red'
      ? 'text-hm-red'
      : accent === 'amber'
      ? 'text-hm-amber'
      : accent === 'blue'
      ? 'text-hm-blue'
      : 'text-white/80';
  return (
    <div className="p-3 border-r border-b border-white/[0.18] last:border-r-0">
      <div className="text-[8px] font-light tracking-[0.22em] uppercase text-white/[0.18] mb-1">{label}</div>
      <div className={`font-mono text-xs ${color}`}>{value}</div>
    </div>
  );
}
