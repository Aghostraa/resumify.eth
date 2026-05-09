export default function ScoreBreakdown({ score }) {
  if (!score) return null;
  const items = [
    { key: 'verification', label: 'Verification', data: score.breakdown.verification },
    { key: 'patternMatch', label: 'Pattern match', data: score.breakdown.patternMatch },
    { key: 'riskFlag', label: 'Risk flags', data: score.breakdown.riskFlag },
    { key: 'ecosystem', label: 'Ecosystem', data: score.breakdown.ecosystem },
  ];

  return (
    <div className="space-y-3">
      {items.map((it) => (
        <div key={it.key} className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-zinc-400">{it.label}</span>
            <span className="text-zinc-300">
              {it.data.value}/{it.data.max}
            </span>
          </div>
          <div className="h-1.5 bg-zinc-800 rounded overflow-hidden">
            <div
              className="h-full bg-emerald-500"
              style={{ width: `${(it.data.value / it.data.max) * 100}%` }}
            />
          </div>
          <div className="text-xs text-zinc-500">
            {it.data.reason} <span className="text-zinc-600">— source: {it.data.source}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
