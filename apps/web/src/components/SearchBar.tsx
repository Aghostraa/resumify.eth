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
    <form onSubmit={handleSubmit} className="hm-input-row w-full">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="vitalik.eth or 0xd8dA…"
        className="hm-input"
        disabled={loading}
        autoFocus
        spellCheck={false}
        autoComplete="off"
      />
      <button
        type="submit"
        disabled={loading || !value.trim()}
        className="hm-input-btn"
      >
        {loading ? 'Loading…' : 'Lookup'}
      </button>
    </form>
  );
}
