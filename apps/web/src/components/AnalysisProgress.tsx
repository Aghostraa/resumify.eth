import type { PipelineStep } from '../types';

const STEP_META: { id: string; label: string }[] = [
  { id: 'fetch',        label: 'Sourcify fetch' },
  { id: 'oli-read',    label: 'OLI labels' },
  { id: 'classify',    label: 'Claude — pattern classification' },
  { id: 'security',    label: 'EthGuard security checks' },
  { id: 'score',       label: 'Compute trust score' },
  { id: 'explain',     label: 'Claude — plain-English explanation' },
  { id: 'name+metadata', label: 'ENS naming + text records' },
  { id: 'attest',      label: 'OLI attestation (EAS on Base)' },
];

interface Props {
  completedSteps: PipelineStep[];
}

export default function AnalysisProgress({ completedSteps }: Props) {
  const done = new Map(completedSteps.map((s) => [s.step, s]));
  const currentIdx = STEP_META.findIndex((s) => !done.has(s.id));

  return (
    <div className="mt-8 border border-ink-700 rounded p-6 space-y-3 animate-fade-in font-mono">
      <h3 className="text-xs uppercase tracking-wider text-ink-400">Pipeline · {STEP_META.length} steps</h3>
      {STEP_META.map((s, i) => {
        const result = done.get(s.id);
        const isRunning = i === currentIdx;
        const isPending = i > currentIdx;

        return (
          <div key={s.id} className="flex items-start gap-3 text-sm">
            <div className="mt-0.5 w-5 h-5 shrink-0 flex items-center justify-center">
              {result ? (
                result.ok ? (
                  <span className="text-acid-400 text-base leading-none">✓</span>
                ) : (
                  <span className="text-rose-400 text-base leading-none">✗</span>
                )
              ) : isRunning ? (
                <span className="w-2 h-2 rounded-full bg-acid-500 animate-pulse block" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-ink-600 block" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <span className={isPending ? 'text-ink-600' : result ? (result.ok ? 'text-ink-200' : 'text-rose-300') : 'text-acid-300'}>
                {i + 1}. {s.label}
              </span>
              {result?.detail && (
                <span className="ml-2 text-xs text-ink-500 truncate">{result.detail}</span>
              )}
              {result?.error && (
                <span className="ml-2 text-xs text-rose-400 truncate">{result.error}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
