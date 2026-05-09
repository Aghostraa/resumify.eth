/**
 * Deterministic scorer. Accepts the structured AI classification + sourcify data,
 * returns a 0-100 trust score with four 0-25 sub-scores. No LLM calls here.
 */

export function calculateScore({ sourcify, classification, patternLibrary }) {
  const verification = scoreVerification(sourcify);
  const patternMatch = scorePatternMatch(classification, patternLibrary);
  const riskFlag = scoreRiskFlags(classification);
  const ecosystem = scoreEcosystem(classification, patternLibrary);

  const total = verification.value + patternMatch.value + riskFlag.value + ecosystem.value;

  return {
    total,
    label: `${total}/100`,
    breakdown: { verification, patternMatch, riskFlag, ecosystem },
  };
}

function scoreVerification(sourcify) {
  if (sourcify?.verified) {
    return { value: 25, max: 25, reason: 'Source fully verified on Sourcify (exact match)', source: 'sourcify.matchType' };
  }
  if (sourcify?.partial) {
    return { value: 15, max: 25, reason: 'Partial match on Sourcify — metadata differs', source: 'sourcify.matchType' };
  }
  return { value: 0, max: 25, reason: 'Not verified on Sourcify', source: 'sourcify.matchType' };
}

function scorePatternMatch(classification, library) {
  const pattern = classification?.pattern;
  if (!pattern || pattern === 'unknown') {
    return { value: 5, max: 25, reason: 'No pattern matched', source: 'ai.classification' };
  }

  const known = library.find((p) => p.slug === pattern);
  const confidence = Number(classification?.confidence ?? 0);

  if (known && confidence >= 0.9) {
    return { value: 25, max: 25, reason: `Strong match against ${known.name}`, source: `pattern:${pattern}` };
  }
  if (known && confidence >= 0.6) {
    return { value: 18, max: 25, reason: `Likely match against ${known.name}`, source: `pattern:${pattern}` };
  }
  if (known) {
    return { value: 10, max: 25, reason: `Weak match against ${known.name}`, source: `pattern:${pattern}` };
  }
  return { value: 5, max: 25, reason: 'Pattern not in library', source: 'ai.classification' };
}

function scoreRiskFlags(classification) {
  const flags = classification?.riskFlags ?? [];
  if (flags.length === 0) {
    return { value: 25, max: 25, reason: 'No risk structures detected', source: 'ai.riskFlags' };
  }
  const severe = flags.filter((f) => f.severity === 'high').length;
  const medium = flags.filter((f) => f.severity === 'medium').length;
  const value = Math.max(0, 25 - severe * 12 - medium * 6);
  return {
    value,
    max: 25,
    reason: `${flags.length} risk flag(s): ${flags.map((f) => f.id).join(', ')}`,
    source: 'ai.riskFlags',
  };
}

function scoreEcosystem(classification, library) {
  const known = library.find((p) => p.slug === classification?.pattern);
  if (!known) return { value: 5, max: 25, reason: 'No ecosystem data', source: 'pattern.cache' };
  const adoption = known.adoptionScore ?? 0; // 0..25 from cache
  return { value: adoption, max: 25, reason: `Pattern present on ${known.chains?.length ?? 0} chains`, source: 'pattern.cache' };
}
