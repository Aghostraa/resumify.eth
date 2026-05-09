import type { OliLabel } from '../types';

interface Props {
  oli: OliLabel | null;
  attestationUrl?: string | null;
}

export default function OliLabels({ oli, attestationUrl }: Props) {
  if (!oli && !attestationUrl) return null;
  const fields: { label: string; value?: string | string[] }[] = [
    { label: 'Owner project', value: oli?.ownerProject },
    { label: 'Contract name', value: oli?.contractName },
    { label: 'Usage category', value: oli?.usageCategory },
    { label: 'Verified by', value: oli?.sourceCodeVerified },
    { label: 'Audit', value: oli?.audit },
    { label: 'ERC type', value: oli?.ercType?.join(', ') },
  ];
  const hasAny = fields.some((f) => f.value);

  return (
    <div>
      <div className="text-[10px] font-light tracking-[0.26em] uppercase text-white/40 mb-3">
        OLI Labels
      </div>
      {hasAny ? (
        <div className="bg-white/[0.025] border border-white/[0.07] rounded-md p-3 space-y-1.5 font-mono text-[11px]">
          {fields
            .filter((f) => f.value)
            .map((f) => (
              <div key={f.label} className="flex gap-3">
                <span className="text-white/40 w-32 shrink-0">{f.label}</span>
                <span className="text-white/85 break-all">{f.value as string}</span>
              </div>
            ))}
        </div>
      ) : (
        <div className="text-xs text-white/30 italic">No OLI labels for this address</div>
      )}
      {attestationUrl && (
        <a
          href={attestationUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-block mt-3 text-[10px] font-light tracking-[0.22em] uppercase text-hm-green hover:underline"
        >
          EAS attestation on Base ↗
        </a>
      )}
    </div>
  );
}
