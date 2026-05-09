import { useState, useRef, useEffect, useCallback } from 'react';
import { ALL_CHAINS, MAINNET_CHAINS, TESTNET_CHAINS, type ChainInfo } from '../utils/chains';

interface Props {
  selected: number[] | null; // null = all mainnet (default)
  onChange: (chains: number[] | null) => void;
}

export default function ChainPicker({ selected, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<'mainnet' | 'testnet' | 'all'>('mainnet');
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const DEFAULT_CHAINS = [1, 10, 56, 137, 8453, 42161, 324, 100, 42220, 43114];
  const selectedSet = new Set(selected ?? DEFAULT_CHAINS);
  const isDefault = selected === null;

  const pool = tab === 'mainnet' ? MAINNET_CHAINS : tab === 'testnet' ? TESTNET_CHAINS : ALL_CHAINS;
  const filtered = query.trim()
    ? ALL_CHAINS.filter(
        (c) =>
          c.name.toLowerCase().includes(query.toLowerCase()) ||
          String(c.id).includes(query)
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

  const toggle = useCallback((chain: ChainInfo) => {
    const next = new Set(selectedSet);
    if (next.has(chain.id)) {
      next.delete(chain.id);
    } else {
      next.add(chain.id);
    }
    onChange(next.size === 0 ? null : [...next]);
  }, [selectedSet, onChange]);

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
    ? `top 10 chains`
    : selected!.length === 0
    ? 'no unverified scan'
    : selected!.length === 1
    ? (ALL_CHAINS.find((c) => c.id === selected![0])?.name ?? `Chain ${selected![0]}`)
    : `${selected!.length} chains`;

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 px-3 py-2 rounded-md border font-mono text-xs transition-colors whitespace-nowrap
          ${open
            ? 'bg-ink-700 border-acid-500 text-ink-100'
            : 'bg-ink-800 border-ink-600 text-ink-400 hover:border-ink-500 hover:text-ink-200'
          }`}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
        </svg>
        {label}
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          className={`transition-transform ${open ? 'rotate-180' : ''}`}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-50 w-80 bg-ink-800 border border-ink-600 rounded-lg shadow-2xl animate-fade-in">
          {/* Search */}
          <div className="p-2 border-b border-ink-700">
            <div className="relative">
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-500" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => { setQuery(e.target.value); }}
                placeholder="search chains…"
                className="w-full bg-ink-900 border border-ink-600 rounded pl-7 pr-3 py-1.5 font-mono text-xs text-ink-100
                           placeholder-ink-600 focus:outline-none focus:border-acid-500 transition-colors"
              />
              {query && (
                <button onClick={() => setQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-600 hover:text-ink-300">
                  ×
                </button>
              )}
            </div>
          </div>

          {/* Tabs */}
          {!query && (
            <div className="flex border-b border-ink-700">
              {(['mainnet', 'testnet', 'all'] as const).map((t) => (
                <button key={t} onClick={() => setTab(t)}
                  className={`flex-1 py-1.5 font-mono text-xs transition-colors ${
                    tab === t ? 'text-ink-100 border-b-2 border-acid-500 -mb-px' : 'text-ink-500 hover:text-ink-300'
                  }`}>
                  {t}
                </button>
              ))}
            </div>
          )}

          {/* Explanation */}
          <div className="px-3 py-1.5 border-b border-ink-700 bg-ink-900/50">
            <p className="font-mono text-xs text-ink-600">
              verified contracts come from Sourcify (all chains). these chains are scanned for <span className="text-ink-500">unverified</span> contracts only.
            </p>
          </div>

          {/* Quick actions */}
          <div className="flex items-center gap-2 px-3 py-1.5 border-b border-ink-700">
            <button onClick={selectAll}
              className="font-mono text-xs text-acid-500 hover:text-acid-400 transition-colors">
              select {query ? 'found' : tab}
            </button>
            <span className="text-ink-700">·</span>
            <button onClick={clearAll}
              className="font-mono text-xs text-ink-500 hover:text-ink-300 transition-colors">
              clear
            </button>
            <span className="text-ink-700">·</span>
            <button onClick={resetDefault}
              className="font-mono text-xs text-ink-500 hover:text-ink-300 transition-colors">
              reset default
            </button>
            <span className="ml-auto font-mono text-xs text-ink-600">{selectedSet.size} selected</span>
          </div>

          {/* Chain list */}
          <div className="max-h-60 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="font-mono text-xs text-ink-600 text-center py-4">no chains match</p>
            ) : (
              filtered.map((chain) => {
                const checked = selectedSet.has(chain.id);
                return (
                  <label key={chain.id}
                    className="flex items-center gap-2.5 px-3 py-1.5 cursor-pointer hover:bg-ink-700/50 transition-colors">
                    <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                      checked ? 'bg-acid-500 border-acid-500' : 'border-ink-500'
                    }`}>
                      {checked && (
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#080b0f" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      )}
                    </div>
                    <input type="checkbox" checked={checked} onChange={() => toggle(chain)} className="sr-only" />
                    <span className="font-mono text-xs text-ink-200 flex-1">{chain.name}</span>
                    <span className="font-mono text-xs text-ink-600">{chain.id}</span>
                    {chain.testnet && (
                      <span className="font-mono text-xs text-amber-400/70">test</span>
                    )}
                  </label>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-ink-700 p-2">
            <button
              onClick={() => { setOpen(false); setQuery(''); }}
              className="w-full font-mono text-xs py-1.5 bg-ink-700 hover:bg-ink-600 text-ink-200 rounded transition-colors"
            >
              apply →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
