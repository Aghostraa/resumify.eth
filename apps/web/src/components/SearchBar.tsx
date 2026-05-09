import { useState, type FormEvent } from 'react';

interface Props {
  onSearch: (query: string) => void;
  loading: boolean;
}

export default function SearchBar({ onSearch, loading }: Props) {
  const [value, setValue] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const q = value.trim();
    if (q) onSearch(q);
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 w-full max-w-2xl mx-auto">
      <div className="relative flex-1">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-ink-500 text-sm select-none">$</span>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="vitalik.eth or 0xd8dA…"
          className="w-full bg-ink-800 border border-ink-600 rounded-md pl-8 pr-4 py-2.5 font-mono text-sm text-ink-100 placeholder-ink-500
                     focus:outline-none focus:border-acid-500 focus:ring-1 focus:ring-acid-500/30 transition-colors"
          disabled={loading}
          autoFocus
        />
      </div>
      <button
        type="submit"
        disabled={loading || !value.trim()}
        className="px-5 py-2.5 bg-acid-500 hover:bg-acid-400 disabled:bg-ink-700 disabled:text-ink-500
                   text-ink-950 font-mono font-semibold text-sm rounded-md transition-colors
                   disabled:cursor-not-allowed whitespace-nowrap"
      >
        {loading ? 'Loading…' : 'lookup →'}
      </button>
    </form>
  );
}
