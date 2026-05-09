import { useState } from 'react';
import type { DeployedContract } from '../types';
import { chainName, truncateAddress, formatDate } from '../utils/chains';
import VerifyModal from './VerifyModal';

interface Props {
  deployments: DeployedContract[];
  onContractVerified: (address: string, chainId: number) => void;
}

type SortKey = 'deployedAt' | 'chainId' | 'verified';

export default function ContractsTable({ deployments, onContractVerified }: Props) {
  const [verifyTarget, setVerifyTarget] = useState<DeployedContract | null>(null);
  const [filter, setFilter] = useState<'all' | 'verified' | 'unverified'>('all');
  const [sortKey, setSortKey] = useState<SortKey>('deployedAt');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  const filtered = deployments
    .filter((d) => {
      if (filter === 'verified') return d.verified;
      if (filter === 'unverified') return !d.verified;
      return true;
    })
    .sort((a, b) => {
      if (sortKey === 'deployedAt') return (b.blockNumber ?? 0) - (a.blockNumber ?? 0);
      if (sortKey === 'chainId') return a.chainId - b.chainId;
      if (sortKey === 'verified') return Number(b.verified) - Number(a.verified);
      return 0;
    });

  const pageCount = Math.ceil(filtered.length / PAGE_SIZE);
  const pageItems = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  function handleSort(key: SortKey) {
    setSortKey(key);
    setPage(0);
  }

  return (
    <div className="animate-slide-up">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <h3 className="font-mono text-sm text-ink-400">
          deployments <span className="text-ink-600">({filtered.length})</span>
        </h3>
        <div className="flex gap-1">
          {(['all', 'verified', 'unverified'] as const).map((f) => (
            <button
              key={f}
              onClick={() => { setFilter(f); setPage(0); }}
              className={`font-mono text-xs px-3 py-1 rounded transition-colors ${
                filter === f
                  ? 'bg-ink-600 text-ink-100'
                  : 'text-ink-500 hover:text-ink-300'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-ink-800 border border-ink-600 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-ink-700">
                <th className="text-left px-4 py-2.5 font-mono text-xs text-ink-500 font-normal">contract</th>
                <th className="text-left px-4 py-2.5 font-mono text-xs text-ink-500 font-normal">address</th>
                <Th label="chain" sortKey="chainId" current={sortKey} onSort={handleSort} />
                <Th label="deployed" sortKey="deployedAt" current={sortKey} onSort={handleSort} />
                <Th label="verified" sortKey="verified" current={sortKey} onSort={handleSort} />
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {pageItems.map((d, i) => (
                <ContractRow
                  key={`${d.chainId}:${d.address}`}
                  contract={d}
                  index={i}
                  onVerify={() => setVerifyTarget(d)}
                />
              ))}
              {pageItems.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center font-mono text-sm text-ink-600">
                    no contracts
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {pageCount > 1 && (
          <div className="border-t border-ink-700 px-4 py-2 flex items-center justify-between">
            <span className="font-mono text-xs text-ink-500">
              {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="font-mono text-xs px-2 py-1 rounded text-ink-400 hover:text-ink-100 disabled:text-ink-700 disabled:cursor-not-allowed transition-colors"
              >
                ← prev
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                disabled={page >= pageCount - 1}
                className="font-mono text-xs px-2 py-1 rounded text-ink-400 hover:text-ink-100 disabled:text-ink-700 disabled:cursor-not-allowed transition-colors"
              >
                next →
              </button>
            </div>
          </div>
        )}
      </div>

      {verifyTarget && (
        <VerifyModal
          contract={verifyTarget}
          onClose={() => setVerifyTarget(null)}
          onVerified={(addr, chainId) => {
            onContractVerified(addr, chainId);
            setVerifyTarget(null);
          }}
        />
      )}
    </div>
  );
}

function Th({ label, sortKey, current, onSort }: { label: string; sortKey: SortKey; current: SortKey; onSort: (k: SortKey) => void }) {
  const active = current === sortKey;
  return (
    <th className="text-left px-4 py-2.5 font-mono text-xs font-normal">
      <button
        onClick={() => onSort(sortKey)}
        className={`flex items-center gap-1 transition-colors ${active ? 'text-ink-200' : 'text-ink-500 hover:text-ink-300'}`}
      >
        {label}
        <span className={active ? 'opacity-100' : 'opacity-0'}>↓</span>
      </button>
    </th>
  );
}

function ContractRow({ contract: d, index, onVerify }: { contract: DeployedContract; index: number; onVerify: () => void }) {
  const name = d.contractName ?? d.blockscoutName;

  return (
    <tr
      className="border-b border-ink-700/50 last:border-0 hover:bg-ink-700/30 transition-colors"
      style={{ animationDelay: `${index * 20}ms` }}
    >
      <td className="px-4 py-2.5">
        <div className="flex items-center gap-2">
          {d.isScam && (
            <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-rose-400/10 border border-rose-400/30 text-rose-400">
              SCAM
            </span>
          )}
          <span className="font-mono text-sm text-ink-200">
            {name ?? <span className="text-ink-600">unnamed</span>}
          </span>
          {d.compilerVersion && (
            <span className="font-mono text-xs text-ink-600">{d.compilerVersion}</span>
          )}
        </div>
      </td>
      <td className="px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-ink-400">{truncateAddress(d.address)}</span>
          <CopyButton text={d.address} />
          {d.txHash && (
            <a
              href={`https://eth.blockscout.com/tx/${d.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink-600 hover:text-blue-400 transition-colors"
              title="View tx"
            >
              <ExternalIcon />
            </a>
          )}
        </div>
      </td>
      <td className="px-4 py-2.5">
        <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-ink-700 border border-ink-600 text-ink-300">
          {chainName(d.chainId)}
        </span>
      </td>
      <td className="px-4 py-2.5">
        <span className="font-mono text-xs text-ink-500">{formatDate(d.deployedAt)}</span>
      </td>
      <td className="px-4 py-2.5">
        {d.verified ? (
          <span className="flex items-center gap-1 font-mono text-xs text-acid-500">
            <span>✓</span> verified
          </span>
        ) : (
          <span className="flex items-center gap-1 font-mono text-xs text-rose-400">
            <span>✗</span> unverified
          </span>
        )}
      </td>
      <td className="px-4 py-2.5">
        {!d.verified && !d.isScam && (
          <button
            onClick={onVerify}
            className="font-mono text-xs px-2.5 py-1 rounded border border-ink-600 text-ink-400
                       hover:border-acid-500 hover:text-acid-500 transition-colors"
          >
            verify →
          </button>
        )}
      </td>
    </tr>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button onClick={copy} className="text-ink-600 hover:text-ink-300 transition-colors" title="Copy address">
      {copied ? (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#39d353" strokeWidth="2.5">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      ) : (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
        </svg>
      )}
    </button>
  );
}

function ExternalIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
    </svg>
  );
}
