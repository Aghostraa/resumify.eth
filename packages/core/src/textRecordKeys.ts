export const TEXT_RECORD_KEYS = {
  trustScore: 'trust-score',
  pattern: 'pattern',
  sourcifyVerified: 'sourcify-verified',
  riskFlags: 'risk-flags',
  securityFindings: 'security-findings',
  ethguardVersion: 'ethguard-version',
  chains: 'chains',
  similarTo: 'similar-to',
  ownerProject: 'owner-project',
  classifiedAt: 'classified-at',
  description: 'description',
  url: 'url',
  attestation: 'attestation',
  // ENSIP-26: links this contract identity back to the agent that issued it.
  // Resolve this name to get the agent's agent-context and verify provenance.
  issuedBy: 'issued-by',
} as const;

export type TextRecordKey = typeof TEXT_RECORD_KEYS[keyof typeof TEXT_RECORD_KEYS];

export const ALL_TEXT_RECORD_KEYS: TextRecordKey[] = Object.values(TEXT_RECORD_KEYS);
