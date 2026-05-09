import {
  TEXT_RECORD_KEYS,
  parseScoreString,
  type Report,
  type RiskFlag,
  type SecurityFinding,
  type SecurityCheck,
  type ScoreBreakdown,
} from '@contractid/core';

const SECURITY_CHECKS: SecurityCheck[] = ['reentrancy', 'frontrun', 'access-control', 'unchecked-call'];

function parseSecurity(s: string | null | undefined): SecurityFinding[] {
  if (!s) return [];
  return s.split(',').map((part) => {
    const [name, status] = part.split(':').map((x) => x.trim());
    const check = (SECURITY_CHECKS.includes(name as SecurityCheck) ? name : 'reentrancy') as SecurityCheck;
    return { check, passed: status === 'safe' || status === 'pass' };
  });
}

function parseRiskFlags(s: string | null | undefined): RiskFlag[] {
  if (!s || s === 'none') return [];
  return s.split(',').map((id) => ({ id: id.trim(), severity: 'medium' as const }));
}

function parseList(s: string | null | undefined): string[] {
  if (!s) return [];
  return s.split(',').map((x) => x.trim()).filter(Boolean);
}

export function parseReport(
  records: Partial<Record<string, string | null>>,
  meta: { address: string; chainId: number; ensName?: string },
): Report | null {
  const scoreStr = records[TEXT_RECORD_KEYS.trustScore];
  if (!scoreStr) return null;
  const parsed = parseScoreString(scoreStr);
  if (!parsed) return null;

  const score: ScoreBreakdown = {
    total: parsed.score,
    verification: 0,
    pattern: 0,
    risk: 0,
    ecosystem: 0,
    security: 0,
  };

  const verifiedRaw = records[TEXT_RECORD_KEYS.sourcifyVerified];
  const sourcifyVerified =
    verifiedRaw === 'true' ? 'true' :
    verifiedRaw === 'partial' ? 'partial' :
    verifiedRaw === 'false' ? 'false' : undefined;

  return {
    address: meta.address,
    chainId: meta.chainId,
    ensName: meta.ensName,
    score,
    riskFlags: parseRiskFlags(records[TEXT_RECORD_KEYS.riskFlags]),
    security: parseSecurity(records[TEXT_RECORD_KEYS.securityFindings]),
    pattern: records[TEXT_RECORD_KEYS.pattern] ?? undefined,
    sourcifyVerified,
    ownerProject: records[TEXT_RECORD_KEYS.ownerProject] ?? undefined,
    similarTo: parseList(records[TEXT_RECORD_KEYS.similarTo]),
    description: records[TEXT_RECORD_KEYS.description] ?? undefined,
    classifiedAt: records[TEXT_RECORD_KEYS.classifiedAt] ?? undefined,
    url: records[TEXT_RECORD_KEYS.url] ?? undefined,
    attestationUrl: records[TEXT_RECORD_KEYS.attestation] ?? undefined,
  };
}
