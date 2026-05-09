import type { MintResult } from '../types';

interface Props {
  ens: MintResult | null;
}

export default function EnsRecord({ ens }: Props) {
  if (!ens) {
    return (
      <div className="space-y-3">
        <div className="text-[10px] font-light tracking-[0.28em] uppercase text-white/40">ENS Identity</div>
        <div className="text-xs text-white/30 italic">
          ENS naming was skipped or failed (check backend logs / .env).
        </div>
      </div>
    );
  }

  const labelParts = ens.name.split('.');
  const head = labelParts[0];
  const tail = labelParts.slice(1).join('.');

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex flex-col gap-1.5 min-w-0">
          <div className="text-[9px] font-light tracking-[0.28em] uppercase text-white/[0.22]">
            ENS Identity
          </div>
          <div className="font-mono text-lg text-white tracking-[0.02em] break-all">
            {head}
            <span className="text-hm-blue">.{tail}</span>
          </div>
        </div>
        <div className="inline-flex items-center gap-2 bg-[rgba(48,209,88,0.07)] border border-[rgba(48,209,88,0.20)] rounded-full px-3.5 py-1.5 shrink-0">
          <div className="hm-eyebrow-dot" />
          <span className="text-[8px] font-light tracking-[0.22em] uppercase text-hm-green">
            Minted Onchain
          </span>
        </div>
      </div>

      {/* Meta strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 border border-white/[0.18] rounded-lg overflow-hidden">
        <Meta label="Type" value={ens.contractType} />
        <Meta label="Forward" value={ens.forwardSet ? 'set' : 'no'} accent={ens.forwardSet ? 'green' : 'red'} />
        <Meta label="Reverse" value={ens.reverseSet ? 'set' : 'skipped'} accent={ens.reverseSet ? 'green' : undefined} />
      </div>

      <div>
        <div className="text-[9px] font-light tracking-[0.26em] uppercase text-white/40 mb-2">
          Text Records
        </div>
        <div className="bg-black border border-white/10 rounded-md p-3 space-y-1.5 font-mono text-[11px] max-h-64 overflow-y-auto">
          {Object.entries(ens.records ?? {}).map(([k, v]) => (
            <div key={k} className="flex gap-3">
              <span className="text-white/40 w-40 shrink-0">{k}</span>
              <span className="text-white/85 break-all">{v || '—'}</span>
            </div>
          ))}
        </div>
      </div>

      {ens.explorerUrl && (
        <a
          href={ens.explorerUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-block text-[10px] font-light tracking-[0.22em] uppercase text-hm-green hover:underline"
        >
          View tx on explorer ↗
        </a>
      )}
    </div>
  );
}

function Meta({ label, value, accent }: { label: string; value: string; accent?: 'green' | 'red' }) {
  const color = accent === 'green' ? 'text-hm-green' : accent === 'red' ? 'text-hm-red' : 'text-white/55';
  return (
    <div className="px-4 py-3 border-r border-white/[0.18] last:border-r-0">
      <div className="text-[8px] font-light tracking-[0.22em] uppercase text-white/[0.18] mb-1">{label}</div>
      <div className={`font-mono text-[11px] ${color}`}>{value}</div>
    </div>
  );
}
