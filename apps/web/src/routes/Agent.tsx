import { useEffect, useState } from 'react';
import { fetchAgentIdentity } from '../api/client';
import type { AgentInfo } from '../types';
import AgentProfile from '../components/AgentProfile';

export default function Agent() {
  const [agent, setAgent] = useState<AgentInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAgentIdentity().then((a) => { setAgent(a); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-xs text-ink-500">loading agent…</p>;

  if (!agent?.ensName) {
    return <p className="text-xs text-ink-500">No agent ENS name configured (set ENS_NAMESPACE / AGENT_ENS_NAME).</p>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl text-ink-100">Agent identity</h2>
        <p className="text-xs text-ink-500">
          The analyzer agent has its own ENS name and ENSIP-26 records. This is who scored every contract on this site.
        </p>
      </div>
      <div className="text-sm">
        <span className="text-ink-400">ENS:</span>{' '}
        <a href={agent.ensProfileUrl ?? '#'} target="_blank" rel="noreferrer" className="text-acid-400 hover:underline font-mono">
          {agent.ensName}
        </a>
      </div>
      <AgentProfile agent={agent} />
    </div>
  );
}
