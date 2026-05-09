import Anthropic from '@anthropic-ai/sdk';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

import { fetchSourcify } from './sourcify.js';
import { calculateScore, type PatternEntry, type ScoreResult } from './scorer.js';
import { mintEnsIdentity, type MintResult } from './ens.js';
import { analyzeSource, ETHGUARD_VERSION } from './ethguard.js';
import { getLabels, getSimilarContracts, attestScore } from './oli.js';
import type { OliLabel, SecurityFinding } from '@contractid/core';
import { isSupportedChain } from '@contractid/config';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PATTERNS_PATH = resolve(__dirname, '../../cache/patterns.json');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = process.env.CLAUDE_MODEL ?? 'claude-sonnet-4-6';

let patternLibraryCache: PatternEntry[] | null = null;
function loadPatternLibrary(): PatternEntry[] {
  if (!patternLibraryCache) {
    patternLibraryCache = JSON.parse(readFileSync(PATTERNS_PATH, 'utf8')) as PatternEntry[];
  }
  return patternLibraryCache;
}

interface SourcifyResult {
  status: string;
  verified?: boolean;
  partial?: boolean;
  contractName?: string;
  abi?: unknown;
  sources?: Record<string, string | { content?: string }>;
}

interface Classification {
  pattern: string;
  confidence: number;
  reasoning: string;
  riskFlags: { id: string; severity: 'high' | 'medium' | 'low'; evidence?: string }[];
  matchedSignatures: string[];
}

export interface PipelineInput {
  address: string;
  chainId: number;
  sourceCode?: string;
}

export interface PipelineStep {
  step: string;
  ok: boolean;
  detail?: string;
  error?: string;
}

export interface PipelineResult {
  address: string;
  chainId: number;
  sourcify: SourcifyResult;
  oli: OliLabel | null;
  classification: Classification;
  security: SecurityFinding[];
  score: ScoreResult;
  explanation: string;
  ens: MintResult | null;
  attestation: { ok: boolean; uid?: string; ipfsHash?: string; attestationUrl?: string; reason?: string } | null;
  steps: PipelineStep[];
  classifiedAt: string;
}

function pickSources(sourcify: SourcifyResult): Record<string, string> {
  if (!sourcify.sources) return {};
  const out: Record<string, string> = {};
  for (const [path, val] of Object.entries(sourcify.sources)) {
    const content = typeof val === 'string' ? val : (val?.content ?? '');
    if (content) out[path] = content;
  }
  return out;
}

export async function runPipeline(input: PipelineInput): Promise<PipelineResult> {
  const { address, chainId, sourceCode } = input;
  if (!isSupportedChain(chainId)) throw new Error(`Unsupported chainId: ${chainId}`);

  const steps: PipelineStep[] = [];

  // [1] FETCH
  console.log('  [1/9] Sourcify fetch…');
  const sourcify = (await fetchSourcify({ chainId, address })) as SourcifyResult;
  const patterns = loadPatternLibrary();
  steps.push({ step: 'fetch', ok: true, detail: `status=${sourcify.status} verified=${!!sourcify.verified}` });

  // [2] OLI READ
  console.log('  [2/9] OLI labels…');
  const oli = await getLabels(address, chainId);
  steps.push({ step: 'oli-read', ok: true, detail: oli?.ownerProject ? `owner=${oli.ownerProject}` : 'no labels' });

  // [3] CLASSIFY
  console.log('  [3/9] classify…');
  const classification = await classifyWithClaude({ sourcify, sourceCode, patterns });
  steps.push({ step: 'classify', ok: true, detail: `pattern=${classification.pattern} conf=${classification.confidence}` });

  // [4] SECURITY
  console.log('  [4/9] security checks…');
  const sources = sourceCode
    ? { 'inline.sol': sourceCode }
    : pickSources(sourcify);
  const security = analyzeSource({ sources });
  const failed = security.filter((s) => !s.passed).length;
  steps.push({ step: 'security', ok: true, detail: `${failed}/${security.length} failed` });

  // [5] SCORE
  console.log('  [5/9] score…');
  const score = calculateScore({
    sourcify,
    classification,
    patternLibrary: patterns,
    security,
    oliOwnerProject: oli?.ownerProject ?? null,
  });
  steps.push({ step: 'score', ok: true, detail: score.label });

  // [6] EXPLAIN
  console.log('  [6/9] explain…');
  const explanation = await explainWithClaude({ classification, score, sourcify, security });
  steps.push({ step: 'explain', ok: true });

  // [7] NAME (subname + forward + reverse via Enscribe)
  console.log('  [7/9] ENS naming…');
  let ens: MintResult | null = null;
  let similarTo: string[] = [];
  if (oli?.ownerProject) {
    similarTo = await getSimilarContracts(oli.ownerProject, address, 5);
  }
  try {
    ens = await mintEnsIdentity({
      address,
      chainId,
      classification,
      score: { label: score.label, total: score.total },
      sourcify,
      security,
      oli: { ownerProject: oli?.ownerProject, similarTo },
      description: explanation,
    });
    steps.push({ step: 'name+metadata', ok: true, detail: `${ens.name} type=${ens.contractType}` });
  } catch (err) {
    steps.push({ step: 'name+metadata', ok: false, error: err instanceof Error ? err.message : String(err) });
  }

  // [9] ATTEST
  console.log('  [9/9] OLI attestation…');
  let attestation: PipelineResult['attestation'] = null;
  if (ens) {
    attestation = await attestScore({
      address,
      chainId,
      ensName: ens.name,
      score: score.total,
      pattern: classification.pattern,
      sourcifyVerified: sourcify.verified ? 'true' : sourcify.partial ? 'partial' : 'false',
      scoreVersion: ETHGUARD_VERSION,
    });
    steps.push({
      step: 'attest',
      ok: attestation.ok,
      detail: attestation.uid ?? attestation.reason,
    });
  } else {
    steps.push({ step: 'attest', ok: false, error: 'skipped (no ENS mint)' });
  }

  return {
    address,
    chainId,
    sourcify,
    oli,
    classification,
    security,
    score,
    explanation,
    ens,
    attestation,
    steps,
    classifiedAt: new Date().toISOString(),
  };
}

async function classifyWithClaude({
  sourcify,
  sourceCode,
  patterns,
}: {
  sourcify: SourcifyResult;
  sourceCode?: string;
  patterns: PatternEntry[];
}): Promise<Classification> {
  const top5 = patterns.slice(0, 5).map((p) => ({
    slug: p.slug,
    name: p.name,
  }));

  let sourceSnippet = sourceCode;
  if (!sourceSnippet && sourcify?.sources) {
    const entries = Object.entries(sourcify.sources)
      .map(([path, val]) => [path, typeof val === 'string' ? val : (val?.content ?? '')] as const)
      .filter(([, c]) => c && c.length > 0)
      .sort((a, b) => b[1].length - a[1].length);
    if (entries.length > 0) sourceSnippet = `// ${entries[0][0]}\n${entries[0][1]}`;
  }

  const system = `You are a smart contract analyst. Given verified contract data and known patterns, classify the contract and identify risk structures. Respond ONLY with strict JSON matching this schema:
{
  "pattern": "<one of: ${patterns.map((p) => p.slug).join(', ')}, or 'unknown'>",
  "confidence": <0.0 to 1.0>,
  "reasoning": "<short justification grounded in the data>",
  "riskFlags": [{"id": "<flag-id>", "severity": "low|medium|high", "evidence": "<what in the code>"}],
  "matchedSignatures": ["<function selectors or names>"]
}`;

  const userMsg = `Sourcify data:
${JSON.stringify({
  verified: sourcify?.verified,
  partial: sourcify?.partial,
  contractName: sourcify?.contractName,
  abi: Array.isArray(sourcify?.abi) ? (sourcify.abi as unknown[]).slice(0, 40) : null,
}, null, 2)}

Source snippet:
${sourceSnippet ? sourceSnippet.slice(0, 8000) : '(no source available)'}

Known patterns:
${JSON.stringify(top5, null, 2)}`;

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system,
    messages: [{ role: 'user', content: userMsg }],
  });

  const block = response.content?.[0];
  const text = block && block.type === 'text' ? block.text : '';

  return safeParseJson<Classification>(text, {
    pattern: 'unknown',
    confidence: 0,
    reasoning: 'Failed to parse model output',
    riskFlags: [],
    matchedSignatures: [],
  });
}

async function explainWithClaude({
  classification,
  score,
  sourcify,
  security,
}: {
  classification: Classification;
  score: ScoreResult;
  sourcify: SourcifyResult;
  security: SecurityFinding[];
}): Promise<string> {
  const system = `You write clear, plain-English explanations for non-technical users. Two short paragraphs maximum. No jargon without inline definition. Ground every claim in the provided data.`;

  const userMsg = `Classification: ${JSON.stringify(classification, null, 2)}
Score breakdown: ${JSON.stringify(score, null, 2)}
Security checks: ${JSON.stringify(security, null, 2)}
Sourcify verified: ${sourcify?.verified} (partial: ${sourcify?.partial})

Write a short identity-card description: what this contract is, how trustworthy it appears, and any risks the user should know.`;

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 512,
    system,
    messages: [{ role: 'user', content: userMsg }],
  });

  const block = response.content?.[0];
  return block && block.type === 'text' ? block.text : '';
}

function safeParseJson<T>(text: string, fallback: T): T {
  if (!text) return fallback;
  try { return JSON.parse(text) as T; } catch {}
  const stripped = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '');
  try { return JSON.parse(stripped) as T; } catch {}
  const start = stripped.indexOf('{');
  const end = stripped.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    try { return JSON.parse(stripped.slice(start, end + 1)) as T; } catch {}
  }
  return fallback;
}
