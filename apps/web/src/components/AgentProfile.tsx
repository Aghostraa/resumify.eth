import { useState } from 'react';
import type { AgentInfo } from '../types';

interface Props {
  agent: AgentInfo | null;
}

export default function AgentProfile({ agent }: Props) {
  const [expanded, setExpanded] = useState(true);
  if (!agent?.records || Object.keys(agent.records).length === 0) return null;

  const records = agent.records;
  let parsedContext: unknown = null;
  if (records['agent-context']) {
    try {
      parsedContext = JSON.parse(records['agent-context']);
    } catch {
      // not JSON, will render raw
    }
  }

  return (
    <section className="hm-card overflow-hidden animate-fade-up">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-6 py-5 hover:bg-white/[0.02] text-left transition-colors"
      >
        <div className="flex items-center gap-3.5">
          <div className="hm-eyebrow-dot animate-eyebrow-pulse" />
          <div>
            <div className="text-[10px] font-light tracking-[0.26em] uppercase text-white/40">
              ENSIP-26 Text Records
            </div>
            <div className="font-mono text-[11px] text-white/30 mt-1">
              {Object.keys(records).length} records · resolver{' '}
              {agent.resolver?.slice(0, 6)}…{agent.resolver?.slice(-4)}
            </div>
          </div>
        </div>
        <span className="text-[10px] font-light tracking-[0.22em] uppercase text-white/40">
          {expanded ? 'Collapse ▲' : 'Expand ▼'}
        </span>
      </button>

      {expanded && (
        <div className="border-t border-white/[0.18] p-6 space-y-3">
          {Object.entries(records).map(([key, value]) => (
            <div key={key} className="flex gap-4 text-[11px]">
              <span className="font-mono text-white/40 w-44 shrink-0">{key}</span>
              <span className="text-white/85 break-all font-mono">
                {key === 'agent-context' && parsedContext ? (
                  <pre className="whitespace-pre-wrap text-[11px] leading-relaxed text-white/65">
                    {JSON.stringify(parsedContext, null, 2)}
                  </pre>
                ) : (
                  value
                )}
              </span>
            </div>
          ))}

          <div className="pt-4 border-t border-white/[0.18] flex gap-4 text-[10px] font-light tracking-[0.22em] uppercase text-white/30">
            {agent.ensProfileUrl && (
              <a
                href={agent.ensProfileUrl}
                target="_blank"
                rel="noreferrer"
                className="hover:text-hm-green transition-colors"
              >
                View on ENS app ↗
              </a>
            )}
            <span className="text-white/[0.18]">·</span>
            <span>ENSIP-26</span>
          </div>
        </div>
      )}
    </section>
  );
}
