export async function analyzeContract({ address, chainId = 11155111, sourceCode }) {
  const res = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address, chainId, sourceCode }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `analyze failed (${res.status})`);
  }
  return res.json();
}

export async function fetchAgentIdentity() {
  const res = await fetch('/api/agent');
  if (!res.ok) return null;
  return res.json();
}
