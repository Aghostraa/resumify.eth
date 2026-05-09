import type { SecurityCheck, SecurityFinding } from '@contractid/core';

export interface EthguardInput {
  sources: Record<string, string>;
}

interface Hit {
  file: string;
  line: number;
  excerpt: string;
}

const STRIP_COMMENTS = /\/\*[\s\S]*?\*\/|\/\/.*$/gm;

function eachLine(sources: Record<string, string>, fn: (file: string, line: number, content: string) => void): void {
  for (const [file, content] of Object.entries(sources)) {
    const stripped = content.replace(STRIP_COMMENTS, '');
    const lines = stripped.split('\n');
    for (let i = 0; i < lines.length; i++) fn(file, i + 1, lines[i]);
  }
}

function buildFinding(
  check: SecurityCheck,
  hits: Hit[],
  passDetail: string,
): SecurityFinding {
  if (hits.length === 0) return { check, passed: true, detail: passDetail };
  const first = hits[0];
  return {
    check,
    passed: false,
    detail: `${hits.length} hit(s); first at ${first.file}:${first.line} — ${first.excerpt.trim().slice(0, 100)}`,
    line: first.line,
  };
}

function checkReentrancy(input: EthguardInput): SecurityFinding {
  const allText = Object.values(input.sources).join('\n').replace(STRIP_COMMENTS, '');
  const usesGuard = /(nonReentrant|ReentrancyGuard|_reentrancyGuard|_nonReentrantBefore)/.test(allText);
  const hits: Hit[] = [];
  eachLine(input.sources, (file, line, content) => {
    if (/\.call\s*\{[^}]*value\s*:/.test(content) || /\.transfer\s*\(/.test(content) || /\.send\s*\(/.test(content)) {
      if (!usesGuard) hits.push({ file, line, excerpt: content });
    }
  });
  return buildFinding('reentrancy', hits, 'no value-transfer external calls or guarded by ReentrancyGuard');
}

function checkAccessControl(input: EthguardInput): SecurityFinding {
  const hits: Hit[] = [];
  eachLine(input.sources, (file, line, content) => {
    if (/tx\.origin/.test(content)) hits.push({ file, line, excerpt: content });
    if (/delegatecall\s*\(/.test(content) && !/_implementation|implementation\(\)|_fallback/.test(content)) {
      hits.push({ file, line, excerpt: content });
    }
  });
  return buildFinding('access-control', hits, 'no tx.origin auth or unguarded delegatecall');
}

function checkUncheckedCall(input: EthguardInput): SecurityFinding {
  const hits: Hit[] = [];
  for (const [file, content] of Object.entries(input.sources)) {
    const stripped = content.replace(STRIP_COMMENTS, '');
    const lines = stripped.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const callMatch = /\.(call|delegatecall|staticcall|send)\s*[\{\(]/.test(line);
      if (!callMatch) continue;
      const window = lines.slice(Math.max(0, i - 1), i + 4).join(' ');
      const checked = /require\s*\(\s*\w*success|\(bool\s+\w+\s*,|=\s*\w+\.(call|delegatecall|staticcall|send)/.test(window);
      const isReverted = /returns?\s*\(\s*bool\s/.test(window);
      if (!checked && !isReverted) hits.push({ file, line: i + 1, excerpt: line });
    }
  }
  return buildFinding('unchecked-call', hits, 'low-level calls have return value checks');
}

function checkFrontrun(input: EthguardInput): SecurityFinding {
  const allText = Object.values(input.sources).join('\n').replace(STRIP_COMMENTS, '');
  const hasOracle = /AggregatorV3Interface|latestAnswer|latestRoundData|getReserves|consult\s*\(|oracle/i.test(allText);
  if (!hasOracle) return { check: 'frontrun', passed: true, detail: 'no oracle/DEX-pricing reads detected' };

  const hasStaleCheck = /(updatedAt|roundId|block\.timestamp\s*-\s*\w+\s*[<>]=)/.test(allText);
  const hasSlippageParam = /(amountOutMin|amountInMax|minOut|maxIn|sqrtPriceLimit)/i.test(allText);
  const hits: Hit[] = [];
  if (!hasStaleCheck && !hasSlippageParam) {
    eachLine(input.sources, (file, line, content) => {
      if (/AggregatorV3Interface|latestAnswer|latestRoundData|getReserves/.test(content)) {
        hits.push({ file, line, excerpt: content });
      }
    });
  }
  return buildFinding('frontrun', hits, 'oracle reads have staleness check or slippage params');
}

export function analyzeSource(input: EthguardInput): SecurityFinding[] {
  if (!input.sources || Object.keys(input.sources).length === 0) {
    return (['reentrancy', 'frontrun', 'access-control', 'unchecked-call'] as SecurityCheck[]).map((check) => ({
      check,
      passed: true,
      detail: 'no source available, check skipped',
    }));
  }
  return [
    checkReentrancy(input),
    checkFrontrun(input),
    checkAccessControl(input),
    checkUncheckedCall(input),
  ];
}

export const ETHGUARD_VERSION = '1.0';
