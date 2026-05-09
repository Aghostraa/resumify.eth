import { useState, useRef, useEffect, useCallback } from 'react';
import { ALL_CHAINS, MAINNET_CHAINS, TESTNET_CHAINS, type ChainInfo } from '../utils/chains';

interface Props {
  selected: number[] | null;
  onChange: (chains: number[] | null) => void;
}

export default function ChainPicker({ selected, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<'mainnet' | 'testnet' | 'all'>('mainnet');
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const DEFAULT_CHAINS = [11155111];
  const selectedSet = new Set(selected ?? DEFAULT_CHAINS);
  const isDefault = selected === null;

  const pool = tab === 'mainnet' ? MAINNET_CHAINS : tab === 'testnet' ? TESTNET_CHAINS : ALL_CHAINS;
  const filtered = query.trim()
    ? ALL_CHAINS.filter(
        (c) =>
          c.name.toLowerCase().includes(query.toLowerCase()) ||
          String(c.id).includes(query),
      )
    : pool;

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const toggle = useCallback(
    (chain: ChainInfo) => {
      const next = new Set(selectedSet);
      if (next.has(chain.id)) next.delete(chain.id);
      else next.add(chain.id);
      onChange(next.size === 0 ? null : [...next]);
    },
    [selectedSet, onChange],
  );

  function selectAll() { onChange(pool.map((c) => c.id)); }
  function clearAll() { onChange([]); }
  function resetDefault() { onChange(null); setOpen(false); }

  const label = isDefault
    ? 'Sepolia'
    : selected!.length === 0
    ? 'No Chains'
    : selected!.length === 1
    ? ALL_CHAINS.find((c) => c.id === selected![0])?.name ?? `Chain ${selected![0]}`
    : `${selected!.length} Chains`;

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 px-4 py-2 rounded-full border text-[10px] font-light tracking-[0.22em] uppercase whitespace-nowrap transition-colors ${
          open
            ? 'border-white/30 text-white bg-white/[0.06]'
            : 'border-white/[0.07] text-white/40 hover:border-white/30 hover:text-white'
        }`}
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <ellipse cx="12" cy="5" rx="9" ry="3" />
          <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
        </svg>
        {label}
        <svg
          width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          className={`transition-transform ${open ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 z-50 w-80 rounded-[12px] overflow-hidden"
          style={{
            background: '#0a0a0a',
            border: '1px solid rgba(255,255,255,0.10)',
            boxShadow: '0 0 0 1px rgba(0,0,0,0.8), 0 24px 48px rgba(0,0,0,0.8), 0 8px 16px rgba(0,0,0,0.6)',
          }}
        >
          {/* Search */}
          <div className="p-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="relative">
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/25" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search chains…"
                className="w-full rounded-md pl-7 pr-3 py-2 text-xs text-white/85 placeholder-white/20 focus:outline-none transition-colors"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              />
              {query && (
                <button onClick={() => setQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 hover:text-white">×</button>
              )}
            </div>
          </div>

          {/* Tabs */}
          {!query && (
            <div className="flex" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {(['mainnet', 'testnet', 'all'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex-1 py-2.5 text-[9px] font-light tracking-[0.22em] uppercase transition-colors ${
                    tab === t ? 'text-white' : 'text-white/30 hover:text-white/60'
                  }`}
                  style={tab === t ? { borderBottom: '1px solid rgba(255,255,255,0.4)', marginBottom: '-1px' } : {}}
                >
                  {t}
                </button>
              ))}
            </div>
          )}

          {/* Info */}
          <div className="px-3.5 py-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
            <p className="text-[10px] font-light leading-relaxed text-white/35">
              Verified contracts from Sourcify (all chains). These chains are scanned for{' '}
              <span className="text-white/50">unverified</span> contracts only.
            </p>
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-2 px-3.5 py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <button onClick={selectAll} className="text-[9px] font-light tracking-[0.18em] uppercase text-hm-green/80 hover:text-hm-green transition-colors">
              Select {query ? 'found' : tab}
            </button>
            <span className="text-white/15">·</span>
            <button onClick={clearAll} className="text-[9px] font-light tracking-[0.18em] uppercase text-white/35 hover:text-white transition-colors">Clear</button>
            <span className="text-white/15">·</span>
            <button onClick={resetDefault} className="text-[9px] font-light tracking-[0.18em] uppercase text-white/35 hover:text-white transition-colors">Reset</button>
            <span className="ml-auto text-[9px] font-light tracking-[0.18em] uppercase text-white/25">
              {selectedSet.size} selected
            </span>
          </div>

          {/* Chain list */}
          <div className="max-h-56 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-xs text-white/30 text-center py-6">No chains match</p>
            ) : (
              filtered.map((chain) => {
                const checked = selectedSet.has(chain.id);
                return (
                  <label
                    key={chain.id}
                    className="flex items-center gap-2.5 px-3.5 py-2 cursor-pointer transition-colors"
                    style={{ background: checked ? 'rgba(255,255,255,0.04)' : undefined }}
                    onMouseEnter={(e) => { if (!checked) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = checked ? 'rgba(255,255,255,0.04)' : ''; }}
                  >
                    <div
                      className="w-3.5 h-3.5 rounded-[3px] flex items-center justify-center shrink-0 transition-all"
                      style={{
                        background: checked ? '#fff' : 'transparent',
                        border: checked ? '1px solid #fff' : '1px solid rgba(255,255,255,0.25)',
                      }}
                    >
                      {checked && (
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3.5">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                    <input type="checkbox" checked={checked} onChange={() => toggle(chain)} className="sr-only" />
                    <span className="text-xs text-white/75 flex-1 font-mono">{chain.name}</span>
                    <span className="text-[10px] text-white/25 font-mono">{chain.id}</span>
                    {chain.testnet && (
                      <span className="text-[8px] tracking-[0.2em] uppercase text-hm-amber/60">test</span>
                    )}
                  </label>
                );
              })
            )}
          </div>

          {/* Apply */}
          <div className="p-2.5" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <button
              onClick={() => { setOpen(false); setQuery(''); }}
              className="w-full py-2.5 rounded-md text-[10px] font-light tracking-[0.22em] uppercase text-black bg-white hover:opacity-90 transition-opacity"
            >
              Apply →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
