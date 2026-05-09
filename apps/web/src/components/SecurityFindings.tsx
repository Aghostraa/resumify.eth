import type { SecurityFinding } from '../types';

interface Props {
  findings: SecurityFinding[];
}

const LABELS: Record<SecurityFinding['check'], string> = {
  reentrancy: 'Reentrancy',
  frontrun: 'Front-running',
  'access-control': 'Access control',
  'unchecked-call': 'Unchecked low-level call',
};

export default function SecurityFindings({ findings }: Props) {
  if (!findings || findings.length === 0) return null;
  return (
    <div>
      <div className="text-[10px] font-light tracking-[0.26em] uppercase text-white/40 mb-3">
        EthGuard Heuristics
      </div>
      <ul className="space-y-2">
        {findings.map((f) => (
          <li key={f.check} className="flex items-start gap-2.5">
            <span className={f.passed ? 'text-hm-green text-base leading-none mt-0.5' : 'text-hm-red text-base leading-none mt-0.5'}>
              {f.passed ? '✓' : '✕'}
            </span>
            <div className="flex-1 min-w-0">
              <span
                className={`text-xs font-light tracking-[0.02em] ${
                  f.passed ? 'text-white/85' : 'text-hm-red/90'
                }`}
              >
                {LABELS[f.check]}
              </span>
              {f.detail && <span className="ml-2 font-mono text-[10px] text-white/40">— {f.detail}</span>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
