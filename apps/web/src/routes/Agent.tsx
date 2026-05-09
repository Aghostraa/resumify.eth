import { useEffect, useState } from 'react';
import { fetchAgentIdentity } from '../api/client';
import type { AgentInfo } from '../types';
import AgentProfile from '../components/AgentProfile';

export default function Agent() {
  const [agent, setAgent] = useState<AgentInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAgentIdentity()
      .then((a) => {
        setAgent(a);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="px-6 md:px-12 py-24 max-w-[1100px] mx-auto flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="hm-eyebrow-dot animate-eyebrow-pulse" />
          <span className="text-[10px] font-light tracking-[0.26em] uppercase text-white/40">
            Loading agent…
          </span>
        </div>
      </section>
    );
  }

  if (!agent?.ensName) {
    return (
      <section className="px-6 md:px-12 py-24 max-w-[1100px] mx-auto">
        <div className="hm-card p-8 text-center">
          <div className="text-[10px] font-light tracking-[0.32em] uppercase text-white/40">
            No Agent ENS Configured
          </div>
          <p className="mt-3 text-sm text-white/55">
            Set <code className="font-mono text-white/70">ENS_NAMESPACE</code> /{' '}
            <code className="font-mono text-white/70">AGENT_ENS_NAME</code> in the API env.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="px-6 md:px-12 pt-16 pb-16 max-w-[1100px] mx-auto">
      <div className="flex flex-col items-center text-center mb-10">
        <div className="flex items-center gap-2 mb-6 animate-fade-up">
          <div className="hm-eyebrow-dot animate-eyebrow-pulse" />
          <div className="text-[10px] font-light tracking-[0.32em] uppercase text-white/30">
            Agent Identity · ENSIP-26
          </div>
        </div>
        <h1
          className="font-display font-extralight tracking-[0.04em] leading-[1.08] text-white mb-5 max-w-[760px] animate-fade-up"
          style={{ fontSize: 'clamp(28px, 4.5vw, 52px)', animationDelay: '0.1s', animationFillMode: 'both', opacity: 0 }}
        >
          The agent <em className="not-italic text-white/[0.28]">behind</em> every score
        </h1>
        <p
          className="font-light tracking-[0.04em] leading-[1.7] text-white/30 max-w-[520px] animate-fade-up"
          style={{ fontSize: 'clamp(13px, 1.6vw, 16px)', animationDelay: '0.2s', animationFillMode: 'both', opacity: 0 }}
        >
          The analyzer agent has its own ENS name and ENSIP-26 records. This is who scored every
          contract on this site.
        </p>
      </div>

      <div className="hm-card p-7 mb-6 animate-fade-up">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex flex-col gap-1.5 min-w-0">
            <div className="text-[9px] font-light tracking-[0.28em] uppercase text-white/[0.22]">
              ENS Name
            </div>
            <a
              href={agent.ensProfileUrl ?? '#'}
              target="_blank"
              rel="noreferrer"
              className="font-mono text-lg text-hm-green hover:underline tracking-[0.02em] break-all"
            >
              {agent.ensName}
            </a>
          </div>
          <div className="inline-flex items-center gap-2 bg-[rgba(48,209,88,0.07)] border border-[rgba(48,209,88,0.20)] rounded-full px-3.5 py-1.5 shrink-0">
            <div className="hm-eyebrow-dot" />
            <span className="text-[8px] font-light tracking-[0.22em] uppercase text-hm-green">
              Live On Sepolia
            </span>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 md:grid-cols-3 border border-white/[0.07] rounded-lg overflow-hidden">
          <Meta label="Model" value={agent.model} />
          <Meta label="Resolver" value={agent.resolver ? `${agent.resolver.slice(0, 6)}…${agent.resolver.slice(-4)}` : '—'} />
          <Meta label="ENSIP" value={agent.ensipCompliance?.join(', ') || 'ENSIP-26'} />
        </div>
      </div>

      <AgentProfile agent={agent} />
    </section>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-4 py-3 border-r border-b border-white/[0.07] last:border-r-0">
      <div className="text-[8px] font-light tracking-[0.22em] uppercase text-white/[0.18] mb-1">{label}</div>
      <div className="font-mono text-[11px] text-white/70">{value}</div>
    </div>
  );
}
