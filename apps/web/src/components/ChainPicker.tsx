import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ALL_CHAINS, MAINNET_CHAINS, TESTNET_CHAINS, type ChainInfo } from '../utils/chains';

interface Props {
  selected: number[] | null;
  onChange: (chains: number[] | null) => void;
}

const PANEL_STYLE: React.CSSProperties = {
  position: 'fixed',
  zIndex: 9999,
  width: 320,
  background: '#000000',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 12,
  boxShadow: '0 0 0 1px #000, 0 20px 60px rgba(0,0,0,0.9)',
  overflow: 'hidden',
};

const DIVIDER: React.CSSProperties = { borderBottom: '1px solid rgba(255,255,255,0.18)' };

export default function ChainPicker({ selected, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<'mainnet' | 'testnet' | 'all'>('mainnet');
  const [panelPos, setPanelPos] = useState({ top: 0, right: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
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

  function openPanel() {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setPanelPos({
      top: rect.bottom + 8,
      right: window.innerWidth - rect.right,
    });
    setOpen(true);
  }

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      const panel = document.getElementById('chain-picker-panel');
      if (panel && !panel.contains(e.target as Node) && !triggerRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', handleClick);
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
  function close() { setOpen(false); setQuery(''); }

  const label = isDefault
    ? 'Sepolia'
    : selected!.length === 0
    ? 'No Chains'
    : selected!.length === 1
    ? ALL_CHAINS.find((c) => c.id === selected![0])?.name ?? `Chain ${selected![0]}`
    : `${selected!.length} Chains`;

  const panel = open ? createPortal(
    <div id="chain-picker-panel" style={{ ...PANEL_STYLE, top: panelPos.top, right: panelPos.right }}>
      {/* Search */}
      <div style={{ padding: '10px', ...DIVIDER }}>
        <div style={{ position: 'relative' }}>
          <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.25)' }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search chains…"
            style={{
              width: '100%', boxSizing: 'border-box',
              background: '#000000',
              border: '1px solid rgba(255,255,255,0.18)',
              borderRadius: 6, paddingLeft: 30, paddingRight: 28, paddingTop: 7, paddingBottom: 7,
              fontSize: 12, color: '#ffffff',
              outline: 'none', fontFamily: 'inherit',
            }}
          />
          {query && (
            <button onClick={() => setQuery('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}>×</button>
          )}
        </div>
      </div>

      {/* Tabs */}
      {!query && (
        <div style={{ display: 'flex', ...DIVIDER }}>
          {(['mainnet', 'testnet', 'all'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1, padding: '10px 0',
                fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase',
                color: tab === t ? '#fff' : 'rgba(255,255,255,0.3)',
                background: 'none', border: 'none', cursor: 'pointer',
                borderBottom: tab === t ? '1px solid rgba(255,255,255,0.5)' : '1px solid transparent',
                marginBottom: -1,
              }}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {/* Info */}
      <div style={{ padding: '10px 14px', background: '#000000', ...DIVIDER }}>
        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', lineHeight: 1.6, margin: 0 }}>
          Verified contracts from Sourcify (all chains). These chains are scanned for{' '}
          <span style={{ color: 'rgba(255,255,255,0.55)' }}>unverified</span> contracts only.
        </p>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', ...DIVIDER }}>
        <button onClick={selectAll} style={{ fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#30d158', background: 'none', border: 'none', cursor: 'pointer' }}>
          Select {query ? 'found' : tab}
        </button>
        <span style={{ color: 'rgba(255,255,255,0.15)' }}>·</span>
        <button onClick={clearAll} style={{ fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', background: 'none', border: 'none', cursor: 'pointer' }}>Clear</button>
        <span style={{ color: 'rgba(255,255,255,0.15)' }}>·</span>
        <button onClick={resetDefault} style={{ fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', background: 'none', border: 'none', cursor: 'pointer' }}>Reset</button>
        <span style={{ marginLeft: 'auto', fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)' }}>
          {selectedSet.size} selected
        </span>
      </div>

      {/* List */}
      <div style={{ maxHeight: 220, overflowY: 'auto' }}>
        {filtered.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '24px 0', fontSize: 12, color: 'rgba(255,255,255,0.3)', margin: 0 }}>No chains match</p>
        ) : (
          filtered.map((chain) => {
            const checked = selectedSet.has(chain.id);
            return (
              <label
                key={chain.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 14px', cursor: 'pointer',
                  background: checked ? 'rgba(255,255,255,0.05)' : 'transparent',
                }}
                onMouseEnter={(e) => { if (!checked) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.025)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = checked ? 'rgba(255,255,255,0.05)' : 'transparent'; }}
              >
                <div style={{
                  width: 14, height: 14, borderRadius: 3, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: checked ? '#fff' : 'transparent',
                  border: checked ? '1px solid #fff' : '1px solid rgba(255,255,255,0.25)',
                }}>
                  {checked && (
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
                <input type="checkbox" checked={checked} onChange={() => toggle(chain)} style={{ display: 'none' }} />
                <span style={{ flex: 1, fontSize: 12, color: 'rgba(255,255,255,0.75)', fontFamily: 'monospace' }}>{chain.name}</span>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace' }}>{chain.id}</span>
                {chain.testnet && <span style={{ fontSize: 8, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,214,10,0.6)' }}>test</span>}
              </label>
            );
          })
        )}
      </div>

      {/* Apply */}
      <div style={{ padding: '10px', borderTop: '1px solid rgba(255,255,255,0.18)' }}>
        <button
          onClick={close}
          style={{
            width: '100%', padding: '10px 0',
            background: '#fff', color: '#000', border: 'none', borderRadius: 6,
            fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase',
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          Apply →
        </button>
      </div>
    </div>,
    document.body,
  ) : null;

  return (
    <>
      <button
        ref={triggerRef}
        onClick={openPanel}
        className={`flex items-center gap-2 px-4 py-2 rounded-full border bg-black text-[10px] font-light tracking-[0.22em] uppercase whitespace-nowrap transition-colors ${
          open
            ? 'border-white/40 text-white'
            : 'border-white/[0.20] text-white/70 hover:border-white/40 hover:text-white'
        }`}
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <ellipse cx="12" cy="5" rx="9" ry="3" />
          <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
        </svg>
        {label}
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`transition-transform ${open ? 'rotate-180' : ''}`}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {panel}
    </>
  );
}
