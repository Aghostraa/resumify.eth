import Anthropic from '@anthropic-ai/sdk';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

import { fetchSourcify } from './sourcify.js';
import { calculateScore } from './scorer.js';
import { mintEnsIdentity } from './ens.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PATTERNS_PATH = resolve(__dirname, '../cache/patterns.json');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = process.env.CLAUDE_MODEL ?? 'claude-sonnet-4-6';

let patternLibraryCache;
function loadPatternLibrary() {
  if (!patternLibraryCache) {
    patternLibraryCache = JSON.parse(readFileSync(PATTERNS_PATH, 'utf8'));
  }
  return patternLibraryCache;
}

export async function runPipeline({ address, chainId, sourceCode }) {
  const steps = [];

  // Step 1 — FETCH
  console.log('  [1/5] fetching Sourcify…');
  const sourcify = await fetchSourcify({ chainId, address });
  const patterns = loadPatternLibrary();
  console.log(`        sourcify.status=${sourcify.status} verified=${sourcify.verified}`);
  steps.push({ step: 'fetch', ok: true, sourcifyStatus: sourcify.status, patternCount: patterns.length });

  // Step 2 — ANALYZE (LLM call 1)
  console.log('  [2/5] classifying with Claude…');
  const classification = await classifyWithClaude({ sourcify, sourceCode, patterns });
  console.log(`        pattern=${classification.pattern} confidence=${classification.confidence}`);
  steps.push({ step: 'analyze', ok: true, pattern: classification.pattern, confidence: classification.confidence });

  // Step 3 — SCORE (deterministic)
  console.log('  [3/5] scoring…');
  const score = calculateScore({ sourcify, classification, patternLibrary: patterns });
  console.log(`        score=${score.total}/100`);
  steps.push({ step: 'score', ok: true, total: score.total });

  // Step 4 — EXPLAIN (LLM call 2)
  console.log('  [4/5] explaining with Claude…');
  const explanation = await explainWithClaude({ classification, score, sourcify });
  steps.push({ step: 'explain', ok: true });

  // Step 5 — MINT
  console.log('  [5/5] minting ENS subname…');
  let ens = null;
  try {
    ens = await mintEnsIdentity({ address, classification, score, sourcify });
    console.log(`        ens=${ens.name} tx=${ens.txHash}`);
    steps.push({ step: 'mint', ok: true, ensName: ens.name, txHash: ens.txHash });
  } catch (err) {
    console.log(`        mint failed: ${err.message}`);
    steps.push({ step: 'mint', ok: false, error: err.message });
  }

  return {
    address,
    chainId,
    sourcify,
    classification,
    score,
    explanation,
    ens,
    steps,
    classifiedAt: new Date().toISOString(),
  };
}

async function classifyWithClaude({ sourcify, sourceCode, patterns }) {
  const top5 = patterns.slice(0, 5).map((p) => ({
    slug: p.slug,
    name: p.name,
    signatures: p.signatures,
    riskMarkers: p.riskMarkers,
  }));

  let sourceSnippet = sourceCode;
  if (!sourceSnippet && sourcify?.sources) {
    // Sourcify sources is an object keyed by file path. Pick the largest file.
    const entries = Object.entries(sourcify.sources);
    const withContent = entries
      .map(([path, val]) => [path, typeof val === 'string' ? val : (val?.content ?? '')])
      .filter(([, content]) => content && content.length > 0)
      .sort((a, b) => b[1].length - a[1].length);
    if (withContent.length > 0) {
      sourceSnippet = `// ${withContent[0][0]}\n${withContent[0][1]}`;
    }
  }

  const system = `You are a smart contract analyst. Given verified contract data from Sourcify and a list of known patterns, classify the contract and identify any risk structures. Respond ONLY with strict JSON matching this schema:
{
  "pattern": "<one of: ${patterns.map((p) => p.slug).join(', ')}, or 'unknown'>",
  "confidence": <0.0 to 1.0>,
  "reasoning": "<short justification grounded in the data>",
  "riskFlags": [{"id": "<flag-id>", "severity": "low|medium|high", "evidence": "<what in the code>"}],
  "matchedSignatures": ["<function selectors or names that drove the match>"]
}`;

  const userMsg = `Sourcify data (truncated):
${JSON.stringify({
  verified: sourcify?.verified,
  partial: sourcify?.partial,
  contractName: sourcify?.contractName,
  abi: Array.isArray(sourcify?.abi) ? sourcify.abi.slice(0, 40) : null,
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

  const text = response.content?.[0]?.text ?? '';
  console.log(`        claude response (first 300 chars): ${text.slice(0, 300).replace(/\n/g, ' ')}`);

  return safeParseJson(text, {
    pattern: 'unknown',
    confidence: 0,
    reasoning: 'Failed to parse model output',
    riskFlags: [],
    matchedSignatures: [],
  });
}

async function explainWithClaude({ classification, score, sourcify }) {
  const system = `You write clear, plain-English explanations for non-technical users. Two short paragraphs maximum. No jargon without inline definition. Ground every claim in the provided data.`;

  const userMsg = `Classification: ${JSON.stringify(classification, null, 2)}
Score breakdown: ${JSON.stringify(score, null, 2)}
Sourcify verified: ${sourcify?.verified} (partial: ${sourcify?.partial})

Write a short identity-card description: what this contract is, how trustworthy it appears, and any risks the user should know.`;

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 512,
    system,
    messages: [{ role: 'user', content: userMsg }],
  });

  return response.content?.[0]?.text ?? '';
}

function safeParseJson(text, fallback) {
  if (!text) return fallback;
  try {
    return JSON.parse(text);
  } catch {}

  const stripped = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '');
  try {
    return JSON.parse(stripped);
  } catch {}

  const start = stripped.indexOf('{');
  const end = stripped.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    try {
      return JSON.parse(stripped.slice(start, end + 1));
    } catch {}
  }

  console.warn('[safeParseJson] failed to parse model output. Raw text:', text.slice(0, 500));
  return fallback;
}
