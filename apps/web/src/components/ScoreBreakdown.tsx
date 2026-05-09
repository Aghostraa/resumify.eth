import type { AnalyzerScore } from '../types';

interface Props {
  score: AnalyzerScore;
}

const COLORS = ['#30d158', '#2997ff', '#ffd60a', '#2997ff', '#30d158'];

export default function ScoreBreakdown({ score }: Props) {
  if (!score) return null;
  const items = [
    { key: 'verification', label: 'Sourcify Verified', data: score.breakdown.verification },
    { key: 'patternMatch', label: 'Pattern Match', data: score.breakdown.patternMatch },
    { key: 'riskFlag', label: 'Risk Flags', data: score.breakdown.riskFlag },
    { key: 'ecosystem', label: 'Ecosystem Adoption', data: score.breakdown.ecosystem },
    { key: 'security', label: 'Security (EthGuard)', data: score.breakdown.security },
  ];

  return (
    <div className="space-y-3.5">
      {items.map((it, i) => {
        const pct = (it.data.value / it.data.max) * 100;
        const color = COLORS[i % COLORS.length];
        return (
          <div key={it.key} className="space-y-1.5">
            <div className="flex justify-between items-baseline">
              <span className="text-[9px] font-light tracking-[0.18em] uppercase text-white/55">
                {it.label}
              </span>
              <span className="font-mono text-[10px] text-white/45">
                {it.data.value} / {it.data.max}
              </span>
            </div>
            <div className="h-[3px] bg-white/[0.06] rounded-sm overflow-hidden">
              <div
                className="h-full rounded-sm transition-all duration-700"
                style={{ width: `${pct}%`, background: color, opacity: i === 3 ? 0.6 : 1 }}
              />
            </div>
            <div className="text-[10px] text-white/30 leading-relaxed">
              {it.data.reason}{' '}
              <span className="text-white/[0.18]">— source: {it.data.source}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
