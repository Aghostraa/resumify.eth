import { useEffect, useState } from 'react';
import ContractInput from './components/ContractInput.jsx';
import AnalysisProgress from './components/AnalysisProgress.jsx';
import IdentityCard from './components/IdentityCard.jsx';
import AgentProfile from './components/AgentProfile.jsx';
import { analyzeContract, fetchAgentIdentity } from './api/contractid.js';

export default function App() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [agent, setAgent] = useState(null);

  useEffect(() => {
    fetchAgentIdentity().then(setAgent).catch(() => setAgent(null));
  }, []);

  async function onSubmit({ address, sourceCode }) {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await analyzeContract({ address, sourceCode });
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-8 py-6 border-b border-zinc-800 flex items-start justify-between gap-6">
        <div>
          <h1 className="text-2xl tracking-tight">
            <span className="text-emerald-400">●</span> ContractID
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Any contract goes in → a named, scored, verified onchain identity comes out.
          </p>
        </div>
        {agent?.ensName && (
          <div className="text-right text-xs">
            <div className="text-zinc-500 uppercase tracking-wider">Agent identity (ENSIP-26)</div>
            <a
              href={agent.ensProfileUrl}
              target="_blank"
              rel="noreferrer"
              className="text-emerald-400 font-mono hover:underline"
            >
              {agent.ensName} ↗
            </a>
            <div className="text-zinc-500 mt-0.5">model: {agent.model}</div>
          </div>
        )}
      </header>

      <main className="flex-1 px-8 py-10 max-w-5xl w-full mx-auto">
        <AgentProfile agent={agent} />
        <ContractInput onSubmit={onSubmit} disabled={loading} />

        {loading && <AnalysisProgress />}

        {error && (
          <div className="mt-8 p-4 border border-red-700 bg-red-950/40 rounded text-red-300 text-sm">
            {error}
          </div>
        )}

        {result && <IdentityCard result={result} />}
      </main>

      <footer className="px-8 py-4 border-t border-zinc-800 text-xs text-zinc-500">
        Sourcify intelligence · Claude reasoning · ENS identity · Sepolia
      </footer>
    </div>
  );
}
