import { useState, useEffect } from 'react';
import type { DeployedContract } from '../types';
import { chainName, truncateAddress, formatDate } from '../utils/chains';
import VerifyModal from './VerifyModal';
import EnscribeButton from './EnscribeButton';
import type { WalletState } from '../hooks/useWallet';

interface EnsHint { ensName: string }
const ensCache = new Map<string, EnsHint | null>();

function useEnsHint(address: string): EnsHint | null | 'loading' {
  const [state, setState] = useState<EnsHint | null | 'loading'>(() => {
    if (ensCache.has(address)) return ensCache.get(address) ?? null;
    return 'loading';
  });
  useEffect(() => {
    if (ensCache.has(address)) { setState(ensCache.get(address) ?? null); return; }
    fetch(`/api/cached/${address}`)
      .then((r) => r.json())
      .then((d: { cached: boolean; ensName?: string }) => {
        const result = d.cached && d.ensName ? { ensName: d.ensName } : null;
        ensCache.set(address, result);
        setState(result);
      })
      .catch(() => { ensCache.set(address, null); setState(null); });
  }, [address]);
  return state;
}

interface Props {
  deployments: DeployedContract[];
  onContractVerified: (address: string, chainId: number) => void;
  onOpenAnalyzer?: (address: string, chainId: number) => void;
  wallet?: WalletState;
}

type SortKey = 'deployedAt' | 'chainId' | 'verified';

export default function ContractsTable({ deployments, onContractVerified, onOpenAnalyzer, wallet }: Props) {
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
    <div className="animate-fade-up">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-baseline gap-3">
          <span className="text-[11px] tracking-[0.30em] uppercase text-white/55">Deployments</span>
          <span className="font-mono text-xs text-white/30">({filtered.length})</span>
        </div>
        <div className="flex gap-1">
          {(['all', 'verified', 'unverified'] as const).map((f) => (
            <button
              key={f}
              onClick={() => {
                setFilter(f);
                setPage(0);
              }}
              className={`text-[10px] font-light tracking-[0.22em] uppercase px-3 py-1.5 rounded-full border transition-colors ${
                filter === f
                  ? 'border-white/30 text-white bg-white/[0.04]'
                  : 'border-white/[0.07] text-white/40 hover:border-white/20 hover:text-white/80'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="hm-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.07]">
                <th className="text-left px-4 py-3 text-[9px] tracking-[0.26em] uppercase text-white/[0.22] font-normal">
                  Contract
                </th>
                <th className="text-left px-4 py-3 text-[9px] tracking-[0.26em] uppercase text-white/[0.22] font-normal">
                  Address
                </th>
                <Th label="Chain" sortKey="chainId" current={sortKey} onSort={handleSort} />
                <Th label="Deployed" sortKey="deployedAt" current={sortKey} onSort={handleSort} />
                <Th label="Verified" sortKey="verified" current={sortKey} onSort={handleSort} />
                <th className="text-left px-4 py-3 text-[9px] tracking-[0.26em] uppercase text-white/[0.22] font-normal">
                  ENS Identity
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {pageItems.map((d, i) => (
                <ContractRow
                  key={`${d.chainId}:${d.address}`}
                  contract={d}
                  index={i}
                  onVerify={() => setVerifyTarget(d)}
                  onOpenAnalyzer={onOpenAnalyzer ? () => onOpenAnalyzer(d.address, d.chainId) : undefined}
                  wallet={wallet}
                />
              ))}
              {pageItems.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-xs text-white/30">
                    no contracts
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {pageCount > 1 && (
          <div className="border-t border-white/[0.07] px-4 py-3 flex items-center justify-between">
            <span className="font-mono text-[10px] text-white/40">
              {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="text-[10px] font-light tracking-[0.22em] uppercase px-3 py-1 rounded-full text-white/40 hover:text-white disabled:text-white/[0.12] disabled:cursor-not-allowed transition-colors"
              >
                ← Prev
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                disabled={page >= pageCount - 1}
                className="text-[10px] font-light tracking-[0.22em] uppercase px-3 py-1 rounded-full text-white/40 hover:text-white disabled:text-white/[0.12] disabled:cursor-not-allowed transition-colors"
              >
                Next →
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

function Th({
  label,
  sortKey,
  current,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  current: SortKey;
  onSort: (k: SortKey) => void;
}) {
  const active = current === sortKey;
  return (
    <th className="text-left px-4 py-3 font-normal">
      <button
        onClick={() => onSort(sortKey)}
        className={`flex items-center gap-1 text-[9px] tracking-[0.26em] uppercase transition-colors ${
          active ? 'text-white/80' : 'text-white/[0.22] hover:text-white/55'
        }`}
      >
        {label}
        <span className={active ? 'opacity-100' : 'opacity-0'}>↓</span>
      </button>
    </th>
  );
}

function ContractRow({
  contract: d,
  index,
  onVerify,
  onOpenAnalyzer,
  wallet,
}: {
  contract: DeployedContract;
  index: number;
  onVerify: () => void;
  onOpenAnalyzer?: () => void;
  wallet?: WalletState;
}) {
  const name = d.contractName ?? d.blockscoutName;
  const ens = useEnsHint(d.address);

  return (
    <tr
      className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors"
      style={{ animationDelay: `${index * 20}ms` }}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {d.isScam && (
            <span className="font-mono text-[9px] px-2 py-0.5 rounded-md bg-[rgba(255,69,58,0.10)] border border-[rgba(255,69,58,0.25)] text-hm-red">
              SCAM
            </span>
          )}
          <span className="font-mono text-sm text-white/85">
            {name ?? <span className="text-white/30">unnamed</span>}
          </span>
          {d.compilerVersion && <span className="font-mono text-[10px] text-white/30">{d.compilerVersion}</span>}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-white/55">{truncateAddress(d.address)}</span>
          <CopyButton text={d.address} />
          {d.txHash && (
            <a
              href={`https://eth.blockscout.com/tx/${d.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/30 hover:text-hm-blue transition-colors"
              title="View tx"
            >
              <ExternalIcon />
            </a>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="font-mono text-[10px] px-2 py-0.5 rounded-md bg-white/[0.03] border border-white/[0.07] text-white/55">
          {chainName(d.chainId)}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className="font-mono text-xs text-white/40">{formatDate(d.deployedAt)}</span>
      </td>
      <td className="px-4 py-3">
        {d.verified ? (
          <span className="flex items-center gap-1.5 font-mono text-xs text-hm-green">
            <span className="hm-eyebrow-dot" /> Verified
          </span>
        ) : (
          <span className="flex items-center gap-1.5 font-mono text-xs text-hm-red/80">
            <span>✗</span> Unverified
          </span>
        )}
      </td>
      <td className="px-4 py-3">
        {ens === 'loading' ? (
          <span className="font-mono text-[10px] text-white/[0.18]">…</span>
        ) : ens ? (
          <a
            href={`https://app.ens.domains/${ens.ensName}`}
            target="_blank"
            rel="noreferrer"
            className="font-mono text-xs text-hm-green hover:underline truncate max-w-[160px] block"
            title={ens.ensName}
          >
            {ens.ensName}
          </a>
        ) : (
          <span className="font-mono text-[10px] text-white/[0.18]">—</span>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="flex gap-1.5 flex-wrap">
          {onOpenAnalyzer && (
            <button
              onClick={onOpenAnalyzer}
              className="text-[10px] tracking-[0.22em] uppercase px-3 py-1 rounded-full border border-white/[0.07] text-white/40 hover:border-white/30 hover:text-white transition-colors"
              title="Score with Hallmark analyzer"
            >
              Score →
            </button>
          )}
          {d.verified && wallet && (
            <EnscribeButton
              contractAddress={d.address}
              chainId={d.chainId}
              contractName={d.contractName ?? d.blockscoutName}
              wallet={wallet}
            />
          )}
          {!d.verified && !d.isScam && (
            <button
              onClick={onVerify}
              className="text-[10px] tracking-[0.22em] uppercase px-3 py-1 rounded-full border border-white/[0.07] text-white/40 hover:border-hm-green/40 hover:text-hm-green transition-colors"
            >
              Verify →
            </button>
          )}
        </div>
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
    <button
      onClick={copy}
      className="text-white/30 hover:text-white transition-colors"
      title="Copy address"
    >
      {copied ? (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#30d158" strokeWidth="2.5">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="9" y="9" width="13" height="13" rx="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      )}
    </button>
  );
}

function ExternalIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}
