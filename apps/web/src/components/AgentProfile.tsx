import { useState } from 'react';
import type { AgentInfo } from '../types';

interface Props {
  agent: AgentInfo | null;
}

export default function AgentProfile({ agent }: Props) {
  const [expanded, setExpanded] = useState(false);
  if (!agent?.records || Object.keys(agent.records).length === 0) return null;

  const records = agent.records;
  let parsedContext: unknown = null;
  if (records['agent-context']) {
    try { parsedContext = JSON.parse(records['agent-context']); } catch {}
  }

  return (
    <section className="mb-8 border border-ink-700 rounded">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-ink-900 text-left"
      >
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-acid-400 animate-pulse" />
          <div>
            <div className="text-sm">
              <span className="text-ink-400">Agent profile (live):</span>{' '}
              <span className="text-acid-400 font-mono">{agent.ensName}</span>
            </div>
            <div className="text-xs text-ink-500">
              {Object.keys(records).length} ENSIP-26 text records · resolver {agent.resolver?.slice(0, 6)}…{agent.resolver?.slice(-4)}
            </div>
          </div>
        </div>
        <span className="text-ink-500 text-xs">{expanded ? 'collapse ▲' : 'expand ▼'}</span>
      </button>

      {expanded && (
        <div className="border-t border-ink-700 p-4 space-y-3 text-xs">
          {Object.entries(records).map(([key, value]) => (
            <div key={key} className="flex gap-3">
              <span className="text-ink-500 font-mono w-44 shrink-0">{key}</span>
              <span className="text-ink-200 break-all font-mono">
                {key === 'agent-context' && parsedContext ? (
                  <pre className="whitespace-pre-wrap text-[11px] leading-relaxed text-ink-300">
                    {JSON.stringify(parsedContext, null, 2)}
                  </pre>
                ) : (
                  value
                )}
              </span>
            </div>
          ))}

          <div className="pt-2 border-t border-ink-700 flex gap-4 text-ink-500">
            {agent.ensProfileUrl && (
              <a href={agent.ensProfileUrl} target="_blank" rel="noreferrer" className="hover:text-acid-400">
                View on ENS app ↗
              </a>
            )}
            <span>·</span>
            <span>ENSIP-26</span>
          </div>
        </div>
      )}
    </section>
  );
}
