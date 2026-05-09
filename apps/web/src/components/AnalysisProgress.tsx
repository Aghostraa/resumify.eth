const STEPS = [
  { id: 'fetch', label: 'Sourcify fetch' },
  { id: 'oli-read', label: 'OLI labels' },
  { id: 'classify', label: 'Claude — pattern classification' },
  { id: 'security', label: 'EthGuard security checks' },
  { id: 'score', label: 'Compute trust score' },
  { id: 'explain', label: 'Claude — plain-English explanation' },
  { id: 'name', label: 'ENS naming (Enscribe)' },
  { id: 'metadata', label: 'Write metadata text records' },
  { id: 'attest', label: 'OLI attestation (EAS on Base)' },
];

export default function AnalysisProgress() {
  return (
    <div className="mt-8 border border-ink-700 rounded p-6 space-y-3 animate-fade-in">
      <h3 className="text-sm uppercase tracking-wider text-ink-400">Pipeline · 9 steps</h3>
      {STEPS.map((s, i) => (
        <div key={s.id} className="flex items-center gap-3 text-sm">
          <span className="w-5 h-5 rounded-full border border-acid-500 flex items-center justify-center">
            <span className="w-2 h-2 rounded-full bg-acid-500 animate-pulse" />
          </span>
          <span className="text-ink-300">
            {i + 1}. {s.label}
          </span>
        </div>
      ))}
    </div>
  );
}
