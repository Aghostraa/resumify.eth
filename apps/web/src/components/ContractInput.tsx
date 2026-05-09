import { useState, useEffect, useRef, type FormEvent } from 'react';
import { ALL_CHAINS } from '../utils/chains';

const SAMPLES = [
  { label: 'USDC (Sepolia)', address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238' },
  { label: 'WETH (Sepolia)', address: '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14' },
];

interface CachedHint {
  ensName: string;
  score?: string;
  pattern?: string;
}

interface Props {
  onSubmit: (input: { address?: string; sourceCode?: string; chainId: number }) => void;
  disabled?: boolean;
  initialAddress?: string;
  initialChainId?: number;
}

type Mode = 'address' | 'source';

function isValidAddress(s: string) {
  return /^0x[0-9a-fA-F]{40}$/.test(s.trim());
}

export default function ContractInput({
  onSubmit,
  disabled,
  initialAddress = '',
  initialChainId = 11155111,
}: Props) {
  const [address, setAddress] = useState(initialAddress);
  const [sourceCode, setSourceCode] = useState('');
  const [chainId, setChainId] = useState(initialChainId);
  const [mode, setMode] = useState<Mode>('address');
  const [hint, setHint] = useState<CachedHint | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setHint(null);
    if (!isValidAddress(address)) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetch(`/api/cached/${address.trim()}`)
        .then((r) => r.json())
        .then((data: { cached: boolean; ensName?: string; records?: Record<string, string> }) => {
          if (data.cached && data.ensName) {
            setHint({
              ensName: data.ensName,
              score: data.records?.['trust-score'],
              pattern: data.records?.['pattern'],
            });
          } else {
            setHint(null);
          }
        })
        .catch(() => setHint(null));
    }, 600);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [address]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (mode === 'address') onSubmit({ address: address.trim(), chainId });
    else onSubmit({ sourceCode, chainId });
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-[680px] mx-auto space-y-3 animate-fade-up">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-2">
          <ModeButton active={mode === 'address'} onClick={() => setMode('address')}>
            Address
          </ModeButton>
          <ModeButton active={mode === 'source'} onClick={() => setMode('source')}>
            Raw Source
          </ModeButton>
        </div>

        <div className="relative">
          <select
            value={chainId}
            onChange={(e) => setChainId(Number(e.target.value))}
            disabled={disabled}
            className="appearance-none bg-black border border-white/15 rounded-full pl-4 pr-9 py-2 text-[10px] font-light tracking-[0.22em] uppercase text-white hover:border-white/30 focus:border-white/45 focus:outline-none transition-colors cursor-pointer"
          >
            <optgroup label="Mainnets">
              {ALL_CHAINS.filter((c) => !c.testnet).map((c) => (
                <option key={c.id} value={c.id} className="bg-black text-white">
                  {c.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="Testnets">
              {ALL_CHAINS.filter((c) => c.testnet).map((c) => (
                <option key={c.id} value={c.id} className="bg-black text-white">
                  {c.name}
                </option>
              ))}
            </optgroup>
          </select>
          <svg
            width="9"
            height="9"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>

      {mode === 'address' ? (
        <div className="hm-input-row">
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="0x... contract address"
            className="hm-input"
            disabled={disabled}
            spellCheck={false}
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={disabled || !address}
            className="hm-input-btn"
          >
            {disabled ? 'Analyzing…' : 'Identify'}
          </button>
        </div>
      ) : (
        <div className="hm-input-row flex-col">
          <textarea
            value={sourceCode}
            onChange={(e) => setSourceCode(e.target.value)}
            placeholder="// Paste Solidity source"
            rows={10}
            className="hm-input font-mono w-full resize-y"
            disabled={disabled}
          />
          <div className="border-t border-white/[0.18] flex justify-end">
            <button
              type="submit"
              disabled={disabled || !sourceCode}
              className="hm-input-btn"
              style={{ padding: '12px 28px' }}
            >
              {disabled ? 'Analyzing…' : 'Identify'}
            </button>
          </div>
        </div>
      )}

      {mode === 'address' && hint && (
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-hm-green/20 bg-hm-green/[0.04] animate-fade-up">
          <div className="w-1.5 h-1.5 rounded-full bg-hm-green shrink-0" />
          <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
            <a
              href={`https://sepolia.app.ens.domains/${hint.ensName}`}
              target="_blank"
              rel="noreferrer"
              className="font-mono text-xs text-hm-green hover:underline truncate"
            >
              {hint.ensName}
            </a>
            {hint.score && (
              <span className="text-[9px] tracking-[0.16em] uppercase text-white/30">
                score {hint.score}
              </span>
            )}
            {hint.pattern && (
              <span className="text-[9px] tracking-[0.16em] uppercase text-white/30">
                · {hint.pattern}
              </span>
            )}
          </div>
          <span className="text-[9px] tracking-[0.16em] uppercase text-hm-green/60 shrink-0">
            Already identified
          </span>
        </div>
      )}

      {mode === 'address' && (
        <div className="text-[10px] font-light tracking-[0.22em] uppercase text-white/55 pl-1">
          Try an example —{' '}
          {SAMPLES.map((s, i) => (
            <span key={s.address}>
              <span
                onClick={() => !disabled && setAddress(s.address)}
                className="text-white cursor-pointer hover:text-hm-green transition-colors"
              >
                {s.label}
              </span>
              {i < SAMPLES.length - 1 && <span className="text-white/55"> · </span>}
            </span>
          ))}
        </div>
      )}
    </form>
  );
}

function ModeButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 rounded-full border text-[10px] font-light tracking-[0.22em] uppercase transition-colors ${
        active
          ? 'border-white/30 text-white bg-white/[0.04]'
          : 'border-white/[0.18] text-white/40 hover:border-white/20 hover:text-white/80'
      }`}
    >
      {children}
    </button>
  );
}
