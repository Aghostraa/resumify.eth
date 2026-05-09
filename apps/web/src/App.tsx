import { Routes, Route, NavLink } from 'react-router-dom';
import Dashboard from './routes/Dashboard';
import Analyzer from './routes/Analyzer';
import Agent from './routes/Agent';

function NavTab({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `font-mono text-sm transition-colors ${isActive ? 'text-acid-400' : 'text-ink-400 hover:text-ink-100'}`
      }
    >
      {children}
    </NavLink>
  );
}

export default function App() {
  return (
    <div className="min-h-screen bg-ink-950 border-grid">
      <header className="border-b border-ink-700/50 bg-ink-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-6">
          <NavLink to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-2 h-2 rounded-full bg-acid-500 glow-green" />
            <span className="font-mono font-semibold text-ink-100">contractid</span>
            <span className="font-mono text-xs text-ink-600">v0.1</span>
          </NavLink>
          <nav className="flex gap-5">
            <NavTab to="/">deployer</NavTab>
            <NavTab to="/analyze">analyzer</NavTab>
            <NavTab to="/agent">agent</NavTab>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-5">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/analyze" element={<Analyzer />} />
          <Route path="/c/:chainId/:address" element={<Analyzer />} />
          <Route path="/agent" element={<Agent />} />
        </Routes>
      </main>

      <footer className="border-t border-ink-700/50 mt-16 py-4 text-center">
        <p className="font-mono text-xs text-ink-700">
          contractid · ETHPrague 2026 · Sourcify · OLI · ENS · EthGuard
        </p>
      </footer>
    </div>
  );
}
