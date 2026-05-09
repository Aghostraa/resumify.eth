import type { RiskFlag, ScoreBreakdown, SecurityFinding } from './types.js';

export const MAX_AXIS = 20;
export const MAX_TOTAL = 100;

export interface ScoreInputs {
  sourcifyMatch: 'full' | 'partial' | 'none';
  patternConfidence: number | null;
  riskFlags: RiskFlag[];
  patternAdoption: number;
  hasOwnerProject: boolean;
  security: SecurityFinding[];
}

export function computeScore(inputs: ScoreInputs): ScoreBreakdown {
  const verification =
    inputs.sourcifyMatch === 'full' ? 20 :
    inputs.sourcifyMatch === 'partial' ? 12 : 0;

  const pc = inputs.patternConfidence;
  const pattern =
    pc == null ? 4 :
    pc >= 0.9 ? 20 :
    pc >= 0.6 ? 14 :
    8;

  let risk = 20;
  for (const flag of inputs.riskFlags) {
    if (flag.severity === 'high') risk -= 10;
    else if (flag.severity === 'medium') risk -= 5;
    else risk -= 2;
  }
  risk = Math.max(0, risk);

  const baseEco = Math.min(MAX_AXIS, Math.max(0, inputs.patternAdoption));
  const ecosystem = Math.min(MAX_AXIS, baseEco + (inputs.hasOwnerProject ? 5 : 0));

  let security = 20;
  for (const f of inputs.security) if (!f.passed) security -= 5;
  security = Math.max(0, security);

  const total = verification + pattern + risk + ecosystem + security;
  return { total, verification, pattern, risk, ecosystem, security };
}

export function formatScore(score: ScoreBreakdown): string {
  return `${score.total}/${MAX_TOTAL}`;
}

export function parseScoreString(s: string): { score: number; max: number } | null {
  const m = s.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (!m) return null;
  return { score: parseInt(m[1], 10), max: parseInt(m[2], 10) };
}
