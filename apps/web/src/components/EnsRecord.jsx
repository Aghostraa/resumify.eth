export default function EnsRecord({ ens }) {
  if (!ens) {
    return (
      <div className="text-xs text-zinc-500 italic">
        ENS minting was skipped or failed (check backend logs / .env).
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <div className="text-xs uppercase tracking-wider text-zinc-400">ENS Name</div>
        <div className="font-mono text-emerald-400 text-lg">{ens.name}</div>
      </div>

      <div>
        <div className="text-xs uppercase tracking-wider text-zinc-400 mb-1">Text records</div>
        <div className="bg-zinc-900 border border-zinc-800 rounded p-3 space-y-1 text-xs font-mono">
          {Object.entries(ens.records ?? {}).map(([k, v]) => (
            <div key={k} className="flex gap-2">
              <span className="text-zinc-500 w-40 shrink-0">{k}</span>
              <span className="text-zinc-200 break-all">{v || '—'}</span>
            </div>
          ))}
        </div>
      </div>

      {ens.txHash && (
        <a
          href={ens.explorerUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-block text-xs text-emerald-400 hover:underline"
        >
          View tx on Sepolia Etherscan ↗
        </a>
      )}
    </div>
  );
}
