import type { AnalyzerResult } from '../types';
import { chainName } from '../utils/chains';
import ScoreBreakdown from './ScoreBreakdown';
import EnsRecord from './EnsRecord';
import OliLabels from './OliLabels';
import SecurityFindings from './SecurityFindings';
import ClaimReverseButton from './ClaimReverseButton';

interface Props {
  result: AnalyzerResult;
}

export default function IdentityCard({ result }: Props) {
  const { score, classification, sourcify, explanation, ens, address, chainId, security, oli, attestation } = result;
  const total = score?.total ?? 0;

  const scoreColor = total >= 80 ? '#30d158' : total >= 50 ? '#ffd60a' : '#ff453a';
  const circumference = 2 * Math.PI * 44;
  const dash = (total / 100) * circumference;

  const high = classification?.riskFlags?.filter((f) => f.severity === 'high').length ?? 0;
  const medium = classification?.riskFlags?.filter((f) => f.severity === 'medium').length ?? 0;
  const low = classification?.riskFlags?.filter((f) => f.severity === 'low').length ?? 0;

  return (
    <div className="mt-10 space-y-5 animate-fade-up">
      {/* Top identity card */}
      <div className="hm-card overflow-hidden">
        <div className="px-7 py-7 border-b border-white/[0.07] flex items-start justify-between gap-5 flex-wrap">
          <div className="flex flex-col gap-2 min-w-0">
            <div className="inline-flex items-center gap-2 self-start bg-[rgba(41,151,255,0.07)] border border-[rgba(41,151,255,0.18)] rounded-md px-3 py-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-hm-blue" />
              <div className="text-[9px] font-light tracking-[0.22em] uppercase text-hm-blue">
                {classification?.pattern ?? 'unknown'} ·{' '}
                {Math.round((classification?.confidence ?? 0) * 100)}% confidence
              </div>
            </div>
            <div className="font-mono text-sm text-white/55 break-all tracking-[0.02em]">{address}</div>
            <div className="text-[10px] font-light tracking-[0.22em] uppercase text-white/30">
              {chainName(chainId)}
            </div>
          </div>

          <div className="flex flex-col items-center gap-1 border border-white/[0.07] rounded-xl px-6 py-4 shrink-0">
            <div className="font-display font-extralight text-3xl leading-none" style={{ color: scoreColor }}>
              {total}
            </div>
            <div className="text-[8px] font-light tracking-[0.22em] uppercase text-white/[0.22]">Trust Score</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 px-7 py-6">
          <Field label="Sourcify" valueClass={sourcify?.verified ? 'text-hm-green' : sourcify?.partial ? 'text-hm-amber' : 'text-white/40'}>
            {sourcify?.verified ? '✓ Full Match' : sourcify?.partial ? '◐ Partial Match' : 'Not verified'}
          </Field>
          <Field label="ENS Identity" valueClass="text-hm-green">
            {ens?.name ?? '—'}
          </Field>
          <Field label="Pattern" valueClass="text-white/80">
            {classification?.pattern ?? 'unknown'}
          </Field>
          <Field label="Compiler" valueClass="text-white/80">
            {sourcify?.contractName ?? '—'}
          </Field>
          <Field label="Risk Flags" valueClass={high > 0 ? 'text-hm-red' : medium > 0 ? 'text-hm-amber' : 'text-hm-green'}>
            {high} High · {medium} Medium · {low} Low
          </Field>
          <Field label="Attestation" valueClass={attestation?.ok ? 'text-hm-green' : 'text-white/40'}>
            {attestation?.ok ? 'Onchain (EAS · Base)' : attestation?.reason ?? 'Skipped'}
          </Field>
        </div>

        {ens?.name && (
          <div className="px-7 py-4 border-t border-white/[0.07] flex items-center justify-between gap-3 flex-wrap">
            <a
              href={`https://app.ens.domains/${ens.name}`}
              target="_blank"
              rel="noreferrer"
              className="font-mono text-sm text-white/55 hover:text-hm-green transition-colors"
            >
              {ens.name}
            </a>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => navigator.clipboard.writeText(ens.name)}
                className="text-[9px] tracking-[0.22em] uppercase border border-white/[0.07] rounded-md px-3 py-1.5 text-white/40 hover:border-white/30 hover:text-white transition-colors"
              >
                Copy ENS
              </button>
              {ens.explorerUrl && (
                <a
                  href={ens.explorerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[9px] tracking-[0.22em] uppercase border border-white/[0.07] rounded-md px-3 py-1.5 text-white/40 hover:border-white/30 hover:text-white transition-colors"
                >
                  View Tx
                </a>
              )}
              <a
                href={`https://sourcify.dev/#/lookup/${address}`}
                target="_blank"
                rel="noreferrer"
                className="text-[9px] tracking-[0.22em] uppercase border border-white/[0.07] rounded-md px-3 py-1.5 text-white/40 hover:border-white/30 hover:text-white transition-colors"
              >
                View Source
              </a>
              <ClaimReverseButton contractAddress={address} ensName={ens.name} />
            </div>
          </div>
        )}
      </div>

      {/* Score Widget */}
      <div className="hm-card overflow-hidden">
        <div className="px-7 py-5 border-b border-white/[0.07] flex items-center justify-between">
          <div className="text-[10px] font-light tracking-[0.28em] uppercase text-white/40">Trust Score</div>
          <div className="text-[9px] font-light tracking-[0.20em] uppercase text-white/[0.18]">
            Based on Sourcify + EthGuard
          </div>
        </div>
        <div className="px-7 py-8 flex items-center gap-10 flex-wrap">
          <div className="relative w-[120px] h-[120px] shrink-0">
            <svg viewBox="0 0 110 110" className="w-[120px] h-[120px] -rotate-90">
              <circle cx="55" cy="55" r="44" stroke="rgba(255,255,255,0.06)" strokeWidth="6" fill="none" />
              <circle
                cx="55"
                cy="55"
                r="44"
                stroke={scoreColor}
                strokeWidth="6"
                fill="none"
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeLinecap="round"
                opacity="0.85"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="font-display font-extralight text-3xl leading-none" style={{ color: scoreColor }}>
                {total}
              </div>
              <div className="text-[9px] font-light tracking-[0.1em] text-white/[0.22]">/ 100</div>
            </div>
          </div>
          <div className="flex-1 min-w-[220px]">
            <ScoreBreakdown score={score} />
          </div>
        </div>
      </div>

      {/* Risk + security findings */}
      {((classification?.riskFlags?.length ?? 0) > 0 || (security?.length ?? 0) > 0) && (
        <div className="hm-card overflow-hidden">
          <div className="px-6 py-4 border-b border-white/[0.07] flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              {high > 0 && (
                <div className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] bg-[rgba(255,69,58,0.15)] text-hm-red">
                  {high}
                </div>
              )}
              {medium > 0 && (
                <div className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] bg-[rgba(255,214,10,0.12)] text-hm-amber">
                  {medium}
                </div>
              )}
              <div className="text-[10px] font-light tracking-[0.26em] uppercase text-white/40">
                Risk Flags Detected
              </div>
            </div>
            <div className="text-[9px] font-light tracking-[0.16em] uppercase text-white/[0.18]">
              Sourced from Sourcify + EthGuard
            </div>
          </div>

          {classification?.riskFlags?.map((flag, i) => (
            <div key={i} className="px-6 py-5 border-b border-white/[0.07] last:border-b-0 flex gap-4 items-start">
              <SeverityChip severity={flag.severity} />
              <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                <div className="text-sm text-white/85 font-light tracking-[0.02em]">{flag.id}</div>
                {flag.evidence && (
                  <div className="text-xs text-white/40 leading-relaxed">{flag.evidence}</div>
                )}
              </div>
            </div>
          ))}

          {security?.length > 0 && (
            <div className="px-6 py-5 border-t border-white/[0.07]">
              <SecurityFindings findings={security} />
            </div>
          )}
        </div>
      )}

      {/* ENS + OLI + explanation */}
      <div className="grid md:grid-cols-2 gap-5">
        <div className="hm-card p-7">
          <EnsRecord ens={ens} />
        </div>
        <div className="hm-card p-7 space-y-5">
          <OliLabels oli={oli} attestationUrl={attestation?.attestationUrl} />
          {explanation && (
            <div>
              <div className="text-[10px] font-light tracking-[0.26em] uppercase text-white/40 mb-2">
                Plain-English Explanation
              </div>
              <p className="text-sm text-white/70 whitespace-pre-wrap leading-relaxed">{explanation}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children, valueClass = 'text-white/80' }: { label: string; children: React.ReactNode; valueClass?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="text-[8px] font-light tracking-[0.26em] uppercase text-white/[0.18]">{label}</div>
      <div className={`font-mono text-xs ${valueClass} leading-relaxed`}>{children}</div>
    </div>
  );
}

function SeverityChip({ severity }: { severity: 'high' | 'medium' | 'low' }) {
  const styles =
    severity === 'high'
      ? { bg: 'rgba(255,69,58,0.12)', color: '#ff453a', border: 'rgba(255,69,58,0.25)' }
      : severity === 'medium'
      ? { bg: 'rgba(255,214,10,0.08)', color: '#ffd60a', border: 'rgba(255,214,10,0.20)' }
      : { bg: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.55)', border: 'rgba(255,255,255,0.07)' };
  return (
    <div
      className="text-[8px] font-normal tracking-[0.18em] uppercase rounded px-2.5 py-1 mt-0.5 border shrink-0"
      style={{ background: styles.bg, color: styles.color, borderColor: styles.border }}
    >
      {severity}
    </div>
  );
}
