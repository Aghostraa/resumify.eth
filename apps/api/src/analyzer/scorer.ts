import { computeScore, MAX_AXIS, MAX_TOTAL, type RiskFlag, type SecurityFinding } from '@contractid/core';

export interface SourcifyData {
  verified?: boolean;
  partial?: boolean;
}

export interface ClassificationData {
  pattern?: string;
  confidence?: number | string;
  riskFlags?: { id: string; severity: 'high' | 'medium' | 'low' }[];
}

export interface PatternEntry {
  slug: string;
  name: string;
  adoptionScore?: number;
  chains?: string[];
}

export interface AxisDetail {
  value: number;
  max: number;
  reason: string;
  source: string;
}

export interface ScoreResult {
  total: number;
  label: string;
  breakdown: {
    verification: AxisDetail;
    patternMatch: AxisDetail;
    riskFlag: AxisDetail;
    ecosystem: AxisDetail;
    security: AxisDetail;
  };
}

export interface ScoreInputs {
  sourcify: SourcifyData | null;
  classification: ClassificationData | null;
  patternLibrary: PatternEntry[];
  security: SecurityFinding[];
  oliOwnerProject?: string | null;
}

export function calculateScore(inputs: ScoreInputs): ScoreResult {
  const sourcifyMatch: 'full' | 'partial' | 'none' = inputs.sourcify?.verified
    ? 'full'
    : inputs.sourcify?.partial
      ? 'partial'
      : 'none';

  const known = inputs.patternLibrary.find((p) => p.slug === inputs.classification?.pattern);
  const confidence = inputs.classification?.confidence != null
    ? Number(inputs.classification.confidence)
    : null;

  const riskFlags: RiskFlag[] = (inputs.classification?.riskFlags ?? []).map((f) => ({
    id: f.id,
    severity: f.severity,
  }));

  const patternAdoptionRaw = known?.adoptionScore ?? 0;
  const patternAdoption = Math.min(MAX_AXIS, Math.round((patternAdoptionRaw / 25) * MAX_AXIS));

  const score = computeScore({
    sourcifyMatch,
    patternConfidence: confidence,
    riskFlags,
    patternAdoption,
    hasOwnerProject: !!inputs.oliOwnerProject,
    security: inputs.security,
  });

  const verification: AxisDetail = {
    value: score.verification,
    max: MAX_AXIS,
    reason: sourcifyMatch === 'full'
      ? 'Source fully verified on Sourcify (exact match)'
      : sourcifyMatch === 'partial'
        ? 'Partial match on Sourcify — metadata differs'
        : 'Not verified on Sourcify',
    source: 'sourcify.matchType',
  };

  const patternMatch: AxisDetail = {
    value: score.pattern,
    max: MAX_AXIS,
    reason: !inputs.classification?.pattern || inputs.classification.pattern === 'unknown'
      ? 'No pattern matched'
      : known
        ? confidence != null && confidence >= 0.9
          ? `Strong match against ${known.name}`
          : confidence != null && confidence >= 0.6
            ? `Likely match against ${known.name}`
            : `Weak match against ${known.name}`
        : 'Pattern not in library',
    source: known ? `pattern:${known.slug}` : 'ai.classification',
  };

  const riskFlag: AxisDetail = {
    value: score.risk,
    max: MAX_AXIS,
    reason: riskFlags.length === 0
      ? 'No risk structures detected'
      : `${riskFlags.length} flag(s): ${riskFlags.map((f) => f.id).join(', ')}`,
    source: 'ai.riskFlags',
  };

  const ecosystem: AxisDetail = {
    value: score.ecosystem,
    max: MAX_AXIS,
    reason: known
      ? `Pattern present on ${known.chains?.length ?? 0} chains${inputs.oliOwnerProject ? ` (OLI: ${inputs.oliOwnerProject})` : ''}`
      : 'No ecosystem data',
    source: known ? 'pattern.cache+oli' : 'pattern.cache',
  };

  const failedSec = inputs.security.filter((f) => !f.passed);
  const security: AxisDetail = {
    value: score.security,
    max: MAX_AXIS,
    reason: failedSec.length === 0
      ? 'No EthGuard heuristics flagged'
      : `${failedSec.length} check(s) failed: ${failedSec.map((f) => f.check).join(', ')}`,
    source: 'ethguard.heuristics',
  };

  return {
    total: score.total,
    label: `${score.total}/${MAX_TOTAL}`,
    breakdown: { verification, patternMatch, riskFlag, ecosystem, security },
  };
}
