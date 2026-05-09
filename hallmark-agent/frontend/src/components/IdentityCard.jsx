import ScoreBreakdown from './ScoreBreakdown.jsx';
import EnsRecord from './EnsRecord.jsx';

export default function IdentityCard({ result }) {
  const { score, classification, sourcify, explanation, ens, address } = result;
  const total = score?.total ?? 0;
  const ring = total >= 80 ? 'ring-emerald-500' : total >= 50 ? 'ring-amber-500' : 'ring-red-500';

  return (
    <div className="mt-8 grid md:grid-cols-2 gap-6">
      <section className="border border-zinc-800 rounded p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider text-zinc-500">Address</div>
            <div className="font-mono text-sm text-zinc-300 break-all">{address}</div>
          </div>
          <div className={`w-20 h-20 rounded-full ring-4 ${ring} flex items-center justify-center bg-zinc-900`}>
            <div className="text-center">
              <div className="text-2xl font-bold">{total}</div>
              <div className="text-[10px] text-zinc-500">/100</div>
            </div>
          </div>
        </div>

        <div>
          <div className="text-xs uppercase tracking-wider text-zinc-500">Pattern</div>
          <div className="text-emerald-400 text-lg">{classification?.pattern ?? 'unknown'}</div>
          <div className="text-xs text-zinc-500">
            confidence {(Number(classification?.confidence ?? 0) * 100).toFixed(0)}%
          </div>
        </div>

        <ScoreBreakdown score={score} />

        {classification?.riskFlags?.length > 0 && (
          <div>
            <div className="text-xs uppercase tracking-wider text-zinc-500 mb-1">Risk flags</div>
            <ul className="space-y-1 text-xs">
              {classification.riskFlags.map((f, i) => (
                <li key={i} className="text-amber-300">
                  <span className="text-amber-500">●</span> {f.id}{' '}
                  <span className="text-zinc-500">— {f.severity}</span>
                  <div className="text-zinc-500 pl-3">{f.evidence}</div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {sourcify?.verified || sourcify?.partial ? (
          <a
            href={`https://sourcify.dev/#/lookup/${address}`}
            target="_blank"
            rel="noreferrer"
            className="inline-block text-xs text-emerald-400 hover:underline"
          >
            View source on Sourcify ↗
          </a>
        ) : (
          <div className="text-xs text-zinc-500">Not verified on Sourcify</div>
        )}
      </section>

      <section className="border border-zinc-800 rounded p-6 space-y-5">
        <EnsRecord ens={ens} />
        {explanation && (
          <div>
            <div className="text-xs uppercase tracking-wider text-zinc-500 mb-1">Explanation</div>
            <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">{explanation}</p>
          </div>
        )}
      </section>
    </div>
  );
}
