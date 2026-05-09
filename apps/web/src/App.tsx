import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import Home from './routes/Home';
import Dashboard from './routes/Dashboard';
import Analyzer from './routes/Analyzer';
import Agent from './routes/Agent';
import OctagonBackground from './components/OctagonBackground';
import WaveOctagonBackground from './components/WaveOctagonBackground';
import NavMark from './components/NavMark';
import Footer from './components/Footer';
import { WalletProvider, useWalletContext } from './contexts/WalletContext';

function NavTab({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `text-[12px] font-light tracking-[0.22em] uppercase transition-colors ${
          isActive ? 'text-white' : 'text-white/55 hover:text-white'
        }`
      }
    >
      {children}
    </NavLink>
  );
}

function AppInner() {
  const wallet = useWalletContext();
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <>
      {isHome ? <WaveOctagonBackground /> : <OctagonBackground />}

      <div className="relative z-10 min-h-screen flex flex-col">
        <header className="flex items-center justify-between px-12 py-6 border-b border-white/[0.18] sticky top-0 z-20 backdrop-blur-md bg-black/40 animate-fade-down">
          <NavLink to="/" className="flex items-center gap-3.5 shrink-0">
            <NavMark size={36} />
            <span className="font-display font-extralight text-lg tracking-[0.22em] uppercase text-white">
              Hallmark
            </span>
          </NavLink>

          {!isHome && (
            <nav className="hidden md:flex items-center gap-10">
              <NavTab to="/deployer">Deployer</NavTab>
              <NavTab to="/analyze">Analyzer</NavTab>
              <NavTab to="/agent">Agent</NavTab>
            </nav>
          )}

          <div className="flex items-center gap-3">
            {wallet.address ? (
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-hm-green hidden sm:block">
                  {wallet.address.slice(0, 6)}…{wallet.address.slice(-4)}
                </span>
                <button onClick={wallet.disconnect} className="hm-cta hm-cta-primary">
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={() => void wallet.connect()}
                disabled={wallet.connecting}
                className="hm-cta hm-cta-primary"
              >
                {wallet.connecting ? 'Connecting…' : 'Connect Wallet'}
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 flex flex-col">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/deployer" element={<Dashboard />} />
            <Route path="/analyze" element={<Analyzer />} />
            <Route path="/c/:chainId/:address" element={<Analyzer />} />
            <Route path="/agent" element={<Agent />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </>
  );
}

export default function App() {
  return (
    <WalletProvider>
      <AppInner />
    </WalletProvider>
  );
}
