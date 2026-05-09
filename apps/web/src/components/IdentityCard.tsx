import type { AnalyzerResult } from '../types';
import { chainName } from '../utils/chains';
import ScoreBreakdown from './ScoreBreakdown';
import EnsRecord from './EnsRecord';
import OliLabels from './OliLabels';
import SecurityFindings from './SecurityFindings';

interface Props {
  result: AnalyzerResult;
}

export default function IdentityCard({ result }: Props) {
  const { score, classification, sourcify, explanation, ens, address, chainId, security, oli, attestation } = result;
  const total = score?.total ?? 0;
  const ring = total >= 80 ? 'ring-acid-500' : total >= 50 ? 'ring-amber-400' : 'ring-rose-400';

  return (
    <div className="mt-8 grid md:grid-cols-2 gap-6 animate-fade-in">
      <section className="border border-ink-700 rounded p-6 space-y-5 bg-ink-900/40">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider text-ink-500">Address · {chainName(chainId)}</div>
            <div className="font-mono text-sm text-ink-300 break-all">{address}</div>
          </div>
          <div className={`w-20 h-20 rounded-full ring-4 ${ring} flex items-center justify-center bg-ink-900`}>
            <div className="text-center">
              <div className="text-2xl font-bold text-ink-100">{total}</div>
              <div className="text-[10px] text-ink-500">/100</div>
            </div>
          </div>
        </div>

        <div>
          <div className="text-xs uppercase tracking-wider text-ink-500">Pattern</div>
          <div className="text-acid-400 text-lg">{classification?.pattern ?? 'unknown'}</div>
          <div className="text-xs text-ink-500">
            confidence {(Number(classification?.confidence ?? 0) * 100).toFixed(0)}%
          </div>
        </div>

        <ScoreBreakdown score={score} />

        <SecurityFindings findings={security} />

        {classification?.riskFlags?.length > 0 && (
          <div>
            <div className="text-xs uppercase tracking-wider text-ink-500 mb-1">Risk flags</div>
            <ul className="space-y-1 text-xs">
              {classification.riskFlags.map((f, i) => (
                <li key={i} className="text-amber-400">
                  <span className="text-amber-400">●</span> {f.id}{' '}
                  <span className="text-ink-500">— {f.severity}</span>
                  {f.evidence && <div className="text-ink-500 pl-3">{f.evidence}</div>}
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
            className="inline-block text-xs text-acid-400 hover:underline"
          >
            View source on Sourcify ↗
          </a>
        ) : (
          <div className="text-xs text-ink-500">Not verified on Sourcify</div>
        )}
      </section>

      <section className="border border-ink-700 rounded p-6 space-y-5 bg-ink-900/40">
        <EnsRecord ens={ens} />
        <OliLabels oli={oli} attestationUrl={attestation?.attestationUrl} />
        {explanation && (
          <div>
            <div className="text-xs uppercase tracking-wider text-ink-500 mb-1">Explanation</div>
            <p className="text-sm text-ink-300 whitespace-pre-wrap leading-relaxed">{explanation}</p>
          </div>
        )}
      </section>
    </div>
  );
}
