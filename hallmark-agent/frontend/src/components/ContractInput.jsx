import { useState } from 'react';

const SAMPLES = [
  { label: 'USDC (Sepolia)', address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238' },
  { label: 'WETH (Sepolia)', address: '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14' },
];

export default function ContractInput({ onSubmit, disabled }) {
  const [address, setAddress] = useState('');
  const [sourceCode, setSourceCode] = useState('');
  const [mode, setMode] = useState('address');

  function handleSubmit(e) {
    e.preventDefault();
    if (mode === 'address') onSubmit({ address: address.trim() });
    else onSubmit({ sourceCode });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-2 text-xs">
        <button
          type="button"
          onClick={() => setMode('address')}
          className={`px-3 py-1 rounded ${mode === 'address' ? 'bg-emerald-500 text-zinc-950' : 'bg-zinc-800 text-zinc-300'}`}
        >
          Address
        </button>
        <button
          type="button"
          onClick={() => setMode('source')}
          className={`px-3 py-1 rounded ${mode === 'source' ? 'bg-emerald-500 text-zinc-950' : 'bg-zinc-800 text-zinc-300'}`}
        >
          Raw source
        </button>
      </div>

      {mode === 'address' ? (
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="0x..."
          className="w-full bg-zinc-900 border border-zinc-800 rounded px-4 py-3 font-mono text-sm focus:border-emerald-500 focus:outline-none"
          disabled={disabled}
        />
      ) : (
        <textarea
          value={sourceCode}
          onChange={(e) => setSourceCode(e.target.value)}
          placeholder="// Paste Solidity source"
          rows={10}
          className="w-full bg-zinc-900 border border-zinc-800 rounded px-4 py-3 font-mono text-xs focus:border-emerald-500 focus:outline-none"
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
                className="px-2 py-1 text-zinc-400 hover:text-emerald-400"
                disabled={disabled}
              >
                {s.label}
              </button>
            ))}
        </div>

        <button
          type="submit"
          disabled={disabled || (mode === 'address' ? !address : !sourceCode)}
          className="px-6 py-2 bg-emerald-500 text-zinc-950 rounded font-medium disabled:opacity-50 hover:bg-emerald-400"
        >
          {disabled ? 'Analyzing…' : 'Analyze'}
        </button>
      </div>
    </form>
  );
}
