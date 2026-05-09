import type { MintResult } from '../types';

interface Props {
  ens: MintResult | null;
}

export default function EnsRecord({ ens }: Props) {
  if (!ens) {
    return (
      <div className="text-xs text-ink-600 italic">
        ENS naming was skipped or failed (check backend logs / .env).
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <div className="text-xs uppercase tracking-wider text-ink-400">ENS Name</div>
        <div className="font-mono text-acid-400 text-lg">{ens.name}</div>
        <div className="text-xs text-ink-500 mt-1">
          contract type: <span className="text-ink-300">{ens.contractType}</span>
          {' · '}forward: <span className={ens.forwardSet ? 'text-acid-400' : 'text-rose-400'}>{ens.forwardSet ? 'set' : 'no'}</span>
          {' · '}reverse: <span className={ens.reverseSet ? 'text-acid-400' : 'text-ink-500'}>{ens.reverseSet ? 'set' : 'skipped'}</span>
        </div>
      </div>

      <div>
        <div className="text-xs uppercase tracking-wider text-ink-400 mb-1">Text records</div>
        <div className="bg-ink-900 border border-ink-700 rounded p-3 space-y-1 text-xs font-mono">
          {Object.entries(ens.records ?? {}).map(([k, v]) => (
            <div key={k} className="flex gap-2">
              <span className="text-ink-500 w-40 shrink-0">{k}</span>
              <span className="text-ink-200 break-all">{v || '—'}</span>
            </div>
          ))}
        </div>
      </div>

      {ens.explorerUrl && (
        <a
          href={ens.explorerUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-block text-xs text-acid-400 hover:underline"
        >
          View tx on explorer ↗
        </a>
      )}
    </div>
  );
}
