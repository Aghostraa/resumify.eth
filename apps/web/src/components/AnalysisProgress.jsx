const STEPS = [
  { id: 'fetch', label: 'Querying Sourcify' },
  { id: 'analyze', label: 'Claude — pattern classification' },
  { id: 'score', label: 'Computing trust score' },
  { id: 'explain', label: 'Claude — plain-English explanation' },
  { id: 'mint', label: 'Minting ENS subname on Sepolia' },
];

export default function AnalysisProgress() {
  return (
    <div className="mt-8 border border-zinc-800 rounded p-6 space-y-3">
      <h3 className="text-sm uppercase tracking-wider text-zinc-400">Pipeline</h3>
      {STEPS.map((s, i) => (
        <div key={s.id} className="flex items-center gap-3 text-sm">
          <span className="w-5 h-5 rounded-full border border-emerald-500 flex items-center justify-center">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </span>
          <span className="text-zinc-300">
            {i + 1}. {s.label}
          </span>
        </div>
      ))}
    </div>
  );
}
