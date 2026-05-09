import { useState, useRef, useEffect, useCallback } from 'react';
import { ALL_CHAINS, MAINNET_CHAINS, TESTNET_CHAINS, type ChainInfo } from '../utils/chains';

interface Props {
  selected: number[] | null; // null = default
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

  function selectAll() {
    onChange(pool.map((c) => c.id));
  }
  function clearAll() {
    onChange([]);
  }
  function resetDefault() {
    onChange(null);
    setOpen(false);
  }

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
            ? 'border-white/30 text-white bg-white/[0.04]'
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
          width="9"
          height="9"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className={`transition-transform ${open ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 w-80 border border-white/10 rounded-[10px] shadow-2xl animate-fade-in overflow-hidden" style={{ background: '#0c0c0c' }}>
          <div className="p-2 border-b border-white/[0.07]">
            <div className="relative">
              <svg
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search chains…"
                className="w-full bg-white/[0.025] border border-white/[0.07] rounded-md pl-7 pr-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-colors"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 hover:text-white"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {!query && (
            <div className="flex border-b border-white/[0.07]">
              {(['mainnet', 'testnet', 'all'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex-1 py-2 text-[10px] font-light tracking-[0.22em] uppercase transition-colors ${
                    tab === t
                      ? 'text-white border-b-2 border-white -mb-px'
                      : 'text-white/30 hover:text-white/70'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          )}

          <div className="px-3 py-2 border-b border-white/[0.07]" style={{ background: '#111' }}>
            <p className="text-[10px] font-light leading-relaxed text-white/40">
              Verified contracts come from Sourcify (all chains). These chains are scanned for{' '}
              <span className="text-white/55">unverified</span> contracts only.
            </p>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.07]">
            <button
              onClick={selectAll}
              className="text-[10px] font-light tracking-[0.18em] uppercase text-hm-green hover:text-hm-green/80 transition-colors"
            >
              Select {query ? 'found' : tab}
            </button>
            <span className="text-white/20">·</span>
            <button
              onClick={clearAll}
              className="text-[10px] font-light tracking-[0.18em] uppercase text-white/40 hover:text-white transition-colors"
            >
              Clear
            </button>
            <span className="text-white/20">·</span>
            <button
              onClick={resetDefault}
              className="text-[10px] font-light tracking-[0.18em] uppercase text-white/40 hover:text-white transition-colors"
            >
              Reset
            </button>
            <span className="ml-auto text-[10px] font-light tracking-[0.18em] uppercase text-white/30">
              {selectedSet.size} selected
            </span>
          </div>

          <div className="max-h-60 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="text-xs text-white/30 text-center py-4">No chains match</p>
            ) : (
              filtered.map((chain) => {
                const checked = selectedSet.has(chain.id);
                return (
                  <label
                    key={chain.id}
                    className="flex items-center gap-2.5 px-3 py-1.5 cursor-pointer hover:bg-white/[0.04] transition-colors"
                  >
                    <div
                      className={`w-3.5 h-3.5 rounded-[3px] border flex items-center justify-center shrink-0 transition-colors ${
                        checked ? 'bg-white border-white' : 'border-white/30'
                      }`}
                    >
                      {checked && (
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                    <input type="checkbox" checked={checked} onChange={() => toggle(chain)} className="sr-only" />
                    <span className="text-xs text-white/80 flex-1 font-mono">{chain.name}</span>
                    <span className="text-xs text-white/30 font-mono">{chain.id}</span>
                    {chain.testnet && (
                      <span className="text-[9px] tracking-[0.2em] uppercase text-hm-amber/70">test</span>
                    )}
                  </label>
                );
              })
            )}
          </div>

          <div className="border-t border-white/[0.07] p-2">
            <button
              onClick={() => {
                setOpen(false);
                setQuery('');
              }}
              className="w-full text-[10px] font-light tracking-[0.22em] uppercase py-2 bg-white text-black rounded-md hover:opacity-90 transition-opacity"
            >
              Apply →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
