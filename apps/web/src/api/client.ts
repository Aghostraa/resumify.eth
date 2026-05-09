import type { AnalyzerResult, AgentInfo, DeveloperResume, PipelineStep } from '../types';

export async function analyzeContract(input: {
  address?: string;
  chainId?: number;
  sourceCode?: string;
}): Promise<AnalyzerResult> {
  const res = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chainId: 11155111, ...input }),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? `analyze failed (${res.status})`);
  }
  return res.json();
}

export async function fetchAgentIdentity(): Promise<AgentInfo | null> {
  const res = await fetch('/api/agent');
  if (!res.ok) return null;
  return res.json();
}

export async function fetchCachedAnalysis(address: string): Promise<{ cached: boolean; ensName?: string; records?: Record<string, string> }> {
  const res = await fetch(`/api/cached/${address}`);
  return res.json() as Promise<{ cached: boolean; ensName?: string; records?: Record<string, string> }>;
}

export function analyzeContractStream(
  input: { address?: string; chainId?: number; sourceCode?: string; force?: boolean; developer?: string },
  onStep: (step: PipelineStep) => void,
  onCached?: (data: { ensName: string; records: Record<string, string> }) => void,
): Promise<AnalyzerResult | null> {
  const params = new URLSearchParams({
    chainId: String(input.chainId ?? 11155111),
    ...(input.address ? { address: input.address } : {}),
    ...(input.sourceCode ? { sourceCode: input.sourceCode } : {}),
    ...(input.force ? { force: 'true' } : {}),
    ...(input.developer ? { developer: input.developer } : {}),
  });
  return new Promise((resolve, reject) => {
    const es = new EventSource(`/api/analyze/stream?${params}`);
    es.addEventListener('step', (e) => {
      try { onStep(JSON.parse((e as MessageEvent).data) as PipelineStep); } catch {}
    });
    es.addEventListener('cached', (e) => {
      es.close();
      try {
        const d = JSON.parse((e as MessageEvent).data) as { ensName: string; records: Record<string, string> };
        onCached?.(d);
        resolve(null);
      } catch { reject(new Error('bad cached JSON')); }
    });
    es.addEventListener('result', (e) => {
      es.close();
      try { resolve(JSON.parse((e as MessageEvent).data) as AnalyzerResult); }
      catch { reject(new Error('bad result JSON')); }
    });
    es.addEventListener('error', (e) => {
      es.close();
      try {
        const d = JSON.parse((e as MessageEvent).data ?? '{}') as { error?: string };
        reject(new Error(d.error ?? 'stream error'));
      } catch { reject(new Error('stream failed')); }
    });
    es.onerror = () => { es.close(); reject(new Error('SSE connection lost')); };
  });
}

export async function fetchResume(query: string, chains?: number[]): Promise<DeveloperResume> {
  const params = chains ? `?chains=${chains.join(',')}` : '';
  const res = await fetch(`/api/resume/${encodeURIComponent(query)}${params}`);
  const data = (await res.json()) as DeveloperResume & { error?: string };
  if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
  return data;
}
