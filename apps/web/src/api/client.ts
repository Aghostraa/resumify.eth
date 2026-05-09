import type { AnalyzerResult, AgentInfo, DeveloperResume } from '../types';

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

export async function fetchResume(query: string, chains?: number[]): Promise<DeveloperResume> {
  const params = chains ? `?chains=${chains.join(',')}` : '';
  const res = await fetch(`/resume/${encodeURIComponent(query)}${params}`);
  const data = (await res.json()) as DeveloperResume & { error?: string };
  if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
  return data;
}
