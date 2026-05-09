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
} as const;

export type TextRecordKey = typeof TEXT_RECORD_KEYS[keyof typeof TEXT_RECORD_KEYS];

export const ALL_TEXT_RECORD_KEYS: TextRecordKey[] = Object.values(TEXT_RECORD_KEYS);
