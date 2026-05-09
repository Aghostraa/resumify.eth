import type { PipelineStep } from '../types';

const STEP_META: { id: string; label: string; short: string }[] = [
  { id: 'fetch', label: 'Sourcify fetch', short: 'Fetch' },
  { id: 'oli-read', label: 'OLI labels', short: 'OLI' },
  { id: 'classify', label: 'Claude — pattern classification', short: 'Classify' },
  { id: 'security', label: 'EthGuard security checks', short: 'Security' },
  { id: 'score', label: 'Compute trust score', short: 'Score' },
  { id: 'explain', label: 'Claude — plain-English explanation', short: 'Explain' },
  { id: 'name+metadata', label: 'ENS naming + text records', short: 'ENS' },
  { id: 'attest', label: 'OLI attestation (EAS on Base)', short: 'Attest' },
];

interface Props {
  completedSteps: PipelineStep[];
}

export default function AnalysisProgress({ completedSteps }: Props) {
  const done = new Map(completedSteps.map((s) => [s.step, s]));
  const currentIdx = STEP_META.findIndex((s) => !done.has(s.id));
  const activeStep = currentIdx >= 0 ? STEP_META[currentIdx] : null;
  const completedCount = done.size;

  return (
    <div className="mt-10 hm-card px-6 md:px-12 py-10 flex flex-col items-center gap-10 animate-fade-up">
      <div className="text-[10px] font-light tracking-[0.32em] uppercase text-white/[0.22]">
        {activeStep ? `Analyzing contract · Step ${completedCount + 1} of ${STEP_META.length}` : 'Pipeline complete'}
      </div>

      {/* Step dots */}
      <div className="flex items-center gap-0 w-full max-w-[680px] overflow-x-auto pb-2">
        {STEP_META.map((s, i) => {
          const result = done.get(s.id);
          const isDone = !!result && result.ok;
          const isFail = !!result && !result.ok;
          const isActive = i === currentIdx;

          const lineColor = isDone
            ? 'linear-gradient(to right, #30d158, rgba(48,209,88,0.2))'
            : isActive
            ? 'linear-gradient(to right, rgba(41,151,255,0.5), transparent)'
            : 'rgba(255,255,255,0.07)';

          return (
            <div key={s.id} className="flex flex-col items-center gap-2.5 flex-1 relative min-w-[64px]">
              {i < STEP_META.length - 1 && (
                <div
                  className="absolute top-4 left-[calc(50%+16px)] h-px"
                  style={{ width: 'calc(100% - 32px)', background: lineColor }}
                />
              )}
              <div
                className={`w-8 h-8 rounded-full border flex items-center justify-center text-[10px] relative z-10 bg-black ${
                  isDone
                    ? 'border-hm-green text-hm-green'
                    : isFail
                    ? 'border-hm-red text-hm-red'
                    : isActive
                    ? 'border-hm-blue text-hm-blue'
                    : 'border-white/[0.07] text-white/[0.18]'
                }`}
                style={
                  isDone
                    ? { background: 'rgba(48,209,88,0.06)' }
                    : isActive
                    ? {
                        background: 'rgba(41,151,255,0.08)',
                        boxShadow: '0 0 14px rgba(41,151,255,0.20)',
                        animation: 'eyebrowPulse 1.6s ease-in-out infinite',
                      }
                    : undefined
                }
              >
                {isDone ? (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path
                      d="M2.5 6 L5 8.5 L9.5 3.5"
                      stroke="currentColor"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : isFail ? (
                  <span className="text-base leading-none">✗</span>
                ) : isActive ? (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <circle cx="5" cy="5" r="2" fill="currentColor" opacity="0.9" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <div
                className={`text-[8px] font-light tracking-[0.18em] uppercase text-center ${
                  isDone
                    ? 'text-white/55'
                    : isFail
                    ? 'text-hm-red'
                    : isActive
                    ? 'text-hm-blue'
                    : 'text-white/[0.18]'
                }`}
              >
                {s.short}
              </div>
            </div>
          );
        })}
      </div>

      {/* Status */}
      {activeStep && (
        <div className="font-mono text-xs text-hm-blue tracking-[0.04em]">
          {humanizeStatus(activeStep.id)}
        </div>
      )}

      {/* Detailed list */}
      <div className="w-full max-w-[680px] border-t border-white/[0.07] pt-6 space-y-2">
        {STEP_META.map((s, i) => {
          const result = done.get(s.id);
          const isRunning = i === currentIdx;
          const isPending = i > currentIdx;

          return (
            <div key={s.id} className="flex items-start gap-3 text-xs">
              <div className="mt-0.5 w-4 h-4 shrink-0 flex items-center justify-center">
                {result ? (
                  result.ok ? (
                    <span className="text-hm-green text-base leading-none">✓</span>
                  ) : (
                    <span className="text-hm-red text-base leading-none">✗</span>
                  )
                ) : isRunning ? (
                  <span className="hm-eyebrow-dot animate-pulse-slow" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-white/10 block" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <span
                  className={
                    isPending
                      ? 'text-white/[0.18]'
                      : result
                      ? result.ok
                        ? 'text-white/85'
                        : 'text-hm-red/90'
                      : 'text-hm-blue'
                  }
                >
                  {i + 1}. {s.label}
                </span>
                {result?.detail && <span className="ml-2 font-mono text-[10px] text-white/40">{result.detail}</span>}
                {result?.error && <span className="ml-2 font-mono text-[10px] text-hm-red/80">{result.error}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function humanizeStatus(id: string): string {
  switch (id) {
    case 'fetch':
      return 'Matching against 27M+ verified contracts…';
    case 'oli-read':
      return 'Reading OLI labels…';
    case 'classify':
      return 'Classifying pattern with Claude…';
    case 'security':
      return 'Running EthGuard heuristics…';
    case 'score':
      return 'Computing trust score…';
    case 'explain':
      return 'Drafting plain-English explanation…';
    case 'name+metadata':
      return 'Minting ENS identity…';
    case 'attest':
      return 'Attesting on Base via EAS…';
    default:
      return 'Working…';
  }
}
