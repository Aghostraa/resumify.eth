import type { AnalyzerScore } from '../types';

interface Props {
  score: AnalyzerScore;
}

export default function ScoreBreakdown({ score }: Props) {
  if (!score) return null;
  const items = [
    { key: 'verification', label: 'Verification', data: score.breakdown.verification },
    { key: 'patternMatch', label: 'Pattern match', data: score.breakdown.patternMatch },
    { key: 'riskFlag', label: 'Risk flags', data: score.breakdown.riskFlag },
    { key: 'ecosystem', label: 'Ecosystem', data: score.breakdown.ecosystem },
    { key: 'security', label: 'Security (EthGuard)', data: score.breakdown.security },
  ];

  return (
    <div className="space-y-3">
      {items.map((it) => (
        <div key={it.key} className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-ink-400">{it.label}</span>
            <span className="text-ink-200">
              {it.data.value}/{it.data.max}
            </span>
          </div>
          <div className="h-1.5 bg-ink-800 rounded overflow-hidden">
            <div
              className="h-full bg-acid-500"
              style={{ width: `${(it.data.value / it.data.max) * 100}%` }}
            />
          </div>
          <div className="text-xs text-ink-500">
            {it.data.reason} <span className="text-ink-600">— source: {it.data.source}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
