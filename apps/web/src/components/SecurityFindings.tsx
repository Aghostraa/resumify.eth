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
      <div className="text-xs uppercase tracking-wider text-ink-400 mb-2">EthGuard heuristics</div>
      <ul className="space-y-1.5 text-xs">
        {findings.map((f) => (
          <li key={f.check} className="flex items-start gap-2">
            <span className={f.passed ? 'text-acid-500' : 'text-rose-400'}>
              {f.passed ? '✓' : '✕'}
            </span>
            <div className="flex-1">
              <span className={f.passed ? 'text-ink-300' : 'text-rose-300'}>
                {LABELS[f.check]}
              </span>
              {f.detail && <span className="text-ink-500 ml-2">— {f.detail}</span>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
