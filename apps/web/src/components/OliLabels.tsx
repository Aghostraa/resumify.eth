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
      <div className="text-xs uppercase tracking-wider text-ink-400 mb-2">OLI labels</div>
      {hasAny ? (
        <div className="bg-ink-900 border border-ink-700 rounded p-3 space-y-1 text-xs font-mono">
          {fields
            .filter((f) => f.value)
            .map((f) => (
              <div key={f.label} className="flex gap-2">
                <span className="text-ink-500 w-32 shrink-0">{f.label}</span>
                <span className="text-ink-200 break-all">{f.value as string}</span>
              </div>
            ))}
        </div>
      ) : (
        <div className="text-xs text-ink-600 italic">No OLI labels for this address</div>
      )}
      {attestationUrl && (
        <a
          href={attestationUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-block text-xs text-acid-400 hover:underline mt-2"
        >
          EAS attestation on Base ↗
        </a>
      )}
    </div>
  );
}
