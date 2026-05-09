import { useState, type FormEvent } from 'react';
import { ALL_CHAINS } from '../utils/chains';

const SAMPLES = [
  { label: 'USDC (Sepolia)', address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238' },
  { label: 'WETH (Sepolia)', address: '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14' },
];

interface Props {
  onSubmit: (input: { address?: string; sourceCode?: string; chainId: number }) => void;
  disabled?: boolean;
  initialAddress?: string;
  initialChainId?: number;
}

type Mode = 'address' | 'source';

export default function ContractInput({ onSubmit, disabled, initialAddress = '', initialChainId = 11155111 }: Props) {
  const [address, setAddress] = useState(initialAddress);
  const [sourceCode, setSourceCode] = useState('');
  const [chainId, setChainId] = useState(initialChainId);
  const [mode, setMode] = useState<Mode>('address');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (mode === 'address') onSubmit({ address: address.trim(), chainId });
    else onSubmit({ sourceCode, chainId });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-2 text-xs items-center">
        <button
          type="button"
          onClick={() => setMode('address')}
          className={`px-3 py-1 rounded ${mode === 'address' ? 'bg-acid-500 text-ink-950' : 'bg-ink-800 text-ink-300'}`}
        >
          Address
        </button>
        <button
          type="button"
          onClick={() => setMode('source')}
          className={`px-3 py-1 rounded ${mode === 'source' ? 'bg-acid-500 text-ink-950' : 'bg-ink-800 text-ink-300'}`}
        >
          Raw source
        </button>

        <div className="ml-auto">
          <select
            value={chainId}
            onChange={(e) => setChainId(Number(e.target.value))}
            disabled={disabled}
            className="bg-ink-800 border border-ink-700 rounded px-2 py-1 text-xs text-ink-200 focus:border-acid-500 focus:outline-none"
          >
            <optgroup label="Mainnets">
              {ALL_CHAINS.filter((c) => !c.testnet).map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </optgroup>
            <optgroup label="Testnets">
              {ALL_CHAINS.filter((c) => c.testnet).map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </optgroup>
          </select>
        </div>
      </div>

      {mode === 'address' ? (
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="0x..."
          className="w-full bg-ink-900 border border-ink-700 rounded px-4 py-3 font-mono text-sm focus:border-acid-500 focus:outline-none"
          disabled={disabled}
        />
      ) : (
        <textarea
          value={sourceCode}
          onChange={(e) => setSourceCode(e.target.value)}
          placeholder="// Paste Solidity source"
          rows={10}
          className="w-full bg-ink-900 border border-ink-700 rounded px-4 py-3 font-mono text-xs focus:border-acid-500 focus:outline-none"
          disabled={disabled}
        />
      )}

      <div className="flex items-center justify-between">
        <div className="flex gap-2 text-xs">
          {mode === 'address' &&
            SAMPLES.map((s) => (
              <button
                key={s.address}
                type="button"
                onClick={() => setAddress(s.address)}
                className="px-2 py-1 text-ink-400 hover:text-acid-400"
                disabled={disabled}
              >
                {s.label}
              </button>
            ))}
        </div>

        <button
          type="submit"
          disabled={disabled || (mode === 'address' ? !address : !sourceCode)}
          className="px-6 py-2 bg-acid-500 text-ink-950 rounded font-medium disabled:opacity-50 hover:bg-acid-400"
        >
          {disabled ? 'Analyzing…' : 'Analyze'}
        </button>
      </div>
    </form>
  );
}
