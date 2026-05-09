import { useState, useEffect } from 'react';
import type { DeployedContract } from '../types';
import { chainName, truncateAddress, formatDate } from '../utils/chains';
import VerifyModal from './VerifyModal';
import EnscribeButton from './EnscribeButton';

interface ContractCache { ensName: string; records: Record<string, string> }
const cacheMap = new Map<string, ContractCache | null>();

function useContractCache(address: string, developerAddress?: string): ContractCache | null | 'loading' {
  const cacheKey = developerAddress ? `${developerAddress}:${address}` : address;
  const [state, setState] = useState<ContractCache | null | 'loading'>(() => {
    if (cacheMap.has(cacheKey)) return cacheMap.get(cacheKey) ?? null;
    return 'loading';
  });
  useEffect(() => {
    if (cacheMap.has(cacheKey)) { setState(cacheMap.get(cacheKey) ?? null); return; }
    const params = new URLSearchParams({ ...(developerAddress ? { developer: developerAddress } : {}) });
    fetch(`/api/cached/${address}?${params}`)
      .then((r) => r.json())
      .then((d: { cached: boolean; ensName?: string; records?: Record<string, string> }) => {
        const result = d.cached && d.ensName ? { ensName: d.ensName, records: d.records ?? {} } : null;
        cacheMap.set(cacheKey, result);
        setState(result);
      })
      .catch(() => { cacheMap.set(cacheKey, null); setState(null); });
  }, [cacheKey, address, developerAddress]);
  return state;
}

interface Props {
  deployments: DeployedContract[];
  onContractVerified: (address: string, chainId: number) => void;
  onOpenAnalyzer?: (address: string, chainId: number) => void;
  developerAddress?: string;
}

type SortKey = 'deployedAt' | 'chainId' | 'verified';

export default function ContractsTable({ deployments, onContractVerified, onOpenAnalyzer, developerAddress }: Props) {
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

  return (
    <div className="animate-fade-up">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-baseline gap-3">
          <span className="text-[11px] tracking-[0.30em] uppercase text-white/55">Deployments</span>
          <span className="font-mono text-xs text-white/30">({filtered.length})</span>
        </div>
        <div className="flex gap-1">
          {(['all', 'verified', 'unverified'] as const).map((f) => (
            <button
              key={f}
              onClick={() => { setFilter(f); setPage(0); }}
              className={`text-[10px] font-light tracking-[0.22em] uppercase px-3 py-1.5 rounded-full border transition-colors ${
                filter === f
                  ? 'border-white/30 text-white bg-white/[0.04]'
                  : 'border-white/[0.18] text-white/40 hover:border-white/20 hover:text-white/80'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="hm-card overflow-hidden">
        <table className="w-full table-fixed">
          <colgroup>
            <col className="w-[40%]" />   {/* Contract + address */}
            <col className="w-[13%]" />   {/* Chain */}
            <col className="w-[12%]" />   {/* Deployed */}
            <col className="w-[10%]" />   {/* Verified */}
            <col className="w-[15%]" />   {/* ENS */}
            <col className="w-[10%]" />   {/* Actions */}
          </colgroup>
          <thead>
            <tr className="border-b border-white/[0.18]">
              <th className="text-left px-4 py-3 text-[9px] tracking-[0.26em] uppercase text-white/[0.22] font-normal">
                Contract
              </th>
              <Th label="Chain" sortKey="chainId" current={sortKey} onSort={(k) => { setSortKey(k); setPage(0); }} />
              <Th label="Deployed" sortKey="deployedAt" current={sortKey} onSort={(k) => { setSortKey(k); setPage(0); }} />
              <Th label="Verified" sortKey="verified" current={sortKey} onSort={(k) => { setSortKey(k); setPage(0); }} />
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
                developerAddress={developerAddress}
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

        {pageCount > 1 && (
          <div className="border-t border-white/[0.18] px-4 py-3 flex items-center justify-between">
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

function Th({ label, sortKey, current, onSort }: {
  label: string; sortKey: SortKey; current: SortKey; onSort: (k: SortKey) => void;
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

function ContractRow({ contract: d, index, onVerify, onOpenAnalyzer, developerAddress }: {
  contract: DeployedContract;
  index: number;
  onVerify: () => void;
  onOpenAnalyzer?: () => void;
  developerAddress?: string;
}) {
  const name = d.contractName ?? d.blockscoutName;
  const cache = useContractCache(d.address, developerAddress);
  const [expanded, setExpanded] = useState(false);
  const hasCache = cache !== 'loading' && cache !== null;

  return (
    <>
      <tr
        className={`border-b border-white/[0.12] last:border-0 transition-colors ${hasCache ? 'cursor-pointer' : ''} ${expanded ? 'bg-white/[0.025]' : hasCache ? 'hover:bg-white/[0.02]' : ''}`}
        style={{ animationDelay: `${index * 20}ms` }}
        onClick={() => { if (hasCache) setExpanded((v) => !v); }}
      >
        {/* Contract: chevron + name stacked over address */}
        <td className="px-4 py-3">
          <div className="flex items-start gap-2 min-w-0">
            <span
              className="mt-[3px] shrink-0 text-[8px] text-white/25 transition-transform duration-150"
              style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)', opacity: hasCache ? 1 : 0 }}
            >
              ▶
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                {d.isScam && (
                  <span className="font-mono text-[8px] px-1.5 py-0.5 rounded bg-[rgba(255,69,58,0.10)] border border-[rgba(255,69,58,0.25)] text-hm-red shrink-0">
                    SCAM
                  </span>
                )}
                <span className="font-mono text-sm text-white/85 truncate">
                  {name ?? <span className="text-white/30 italic text-xs">unnamed</span>}
                </span>
                {d.compilerVersion && (
                  <span className="font-mono text-[9px] text-white/25 shrink-0">{d.compilerVersion}</span>
                )}
              </div>
              {/* Address row */}
              <div className="flex items-center gap-1.5 mt-0.5" onClick={(e) => e.stopPropagation()}>
                <span className="font-mono text-[10px] text-white/35">{truncateAddress(d.address)}</span>
                <CopyButton text={d.address} />
                {d.txHash && (
                  <a
                    href={`https://eth.blockscout.com/tx/${d.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/25 hover:text-hm-blue transition-colors"
                    title="View tx"
                  >
                    <ExternalIcon />
                  </a>
                )}
              </div>
            </div>
          </div>
        </td>

        {/* Chain */}
        <td className="px-4 py-3">
          <span className="font-mono text-[10px] px-2 py-0.5 rounded-md bg-white/[0.03] border border-white/[0.18] text-white/50 whitespace-nowrap">
            {chainName(d.chainId)}
          </span>
        </td>

        {/* Deployed */}
        <td className="px-4 py-3">
          <span className="font-mono text-[10px] text-white/35 whitespace-nowrap">{formatDate(d.deployedAt)}</span>
        </td>

        {/* Verified — icon only */}
        <td className="px-4 py-3">
          {d.verified ? (
            <span className="flex items-center gap-1 text-hm-green" title="Verified on Sourcify">
              <VerifiedIcon />
              <span className="font-mono text-[10px]">Verified</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 text-hm-red/60" title="Not verified">
              <UnverifiedIcon />
              <span className="font-mono text-[10px]">None</span>
            </span>
          )}
        </td>

        {/* ENS */}
        <td className="px-4 py-3">
          {cache === 'loading' ? (
            <span className="font-mono text-[9px] text-white/20 animate-pulse">resolving…</span>
          ) : cache ? (
            <a
              href={`https://app.ens.domains/${cache.ensName}`}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="font-mono text-[10px] text-hm-green hover:underline block truncate"
              title={cache.ensName}
            >
              {cache.ensName}
            </a>
          ) : (
            <span className="font-mono text-[10px] text-white/[0.18]">—</span>
          )}
        </td>

        {/* Actions — compact, no wrapping */}
        <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-1 justify-end">
            {onOpenAnalyzer && (
              <ActionBtn
                onClick={onOpenAnalyzer}
                title={hasCache ? 'Re-analyze' : 'Analyze & score'}
                active={!hasCache}
              >
                <ScoreIcon />
              </ActionBtn>
            )}
            {d.chainId === 11155111 && (
              <EnscribeButton
                contractAddress={d.address}
                chainId={d.chainId}
                developerAddress={developerAddress}
              />
            )}
            {!d.verified && !d.isScam && (
              <ActionBtn onClick={onVerify} title="Verify source on Sourcify">
                <VerifyShieldIcon />
              </ActionBtn>
            )}
          </div>
        </td>
      </tr>

      {/* Expanded analysis panel */}
      {expanded && hasCache && (
        <tr className="border-b border-white/[0.12]">
          <td colSpan={6} className="px-4 pb-4 pt-0">
            <ExpandedAnalysis cache={cache} address={d.address} chainId={d.chainId} />
          </td>
        </tr>
      )}
    </>
  );
}

function ActionBtn({ onClick, title, children, active }: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`w-7 h-7 flex items-center justify-center rounded-md border transition-colors ${
        active
          ? 'border-hm-green/30 text-hm-green/70 hover:border-hm-green/60 hover:text-hm-green'
          : 'border-white/[0.18] text-white/30 hover:border-white/25 hover:text-white/70'
      }`}
    >
      {children}
    </button>
  );
}

function ExpandedAnalysis({ cache, address }: { cache: ContractCache; address: string; chainId: number }) {
  const r = cache.records;
  const rawScore = r['trust-score'] ?? '';
  const scoreNum = parseInt(rawScore, 10);
  const hasScore = !isNaN(scoreNum);
  const scoreColor = hasScore
    ? scoreNum >= 80 ? '#30d158' : scoreNum >= 50 ? '#ffd60a' : '#ff453a'
    : 'rgba(255,255,255,0.2)';

  const pattern = r['pattern'];
  const sourcify = r['sourcify-verified'];
  const flags = r['risk-flags'];
  const description = r['description'];
  const classifiedAt = r['classified-at'];
  const chains = r['chains'];
  const similarTo = r['similar-to'];
  const security = r['security-findings'];
  const ownerProject = r['owner-project'];
  const issuedBy = r['issued-by'];

  const flagList = flags && flags !== 'none' ? flags.split(',').filter(Boolean) : [];

  return (
    <div className="mt-2 rounded-xl border border-white/[0.18] bg-white/[0.015] overflow-hidden">
      {/* Header row */}
      <div className="px-5 py-3 border-b border-white/[0.06] flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="hm-eyebrow-dot shrink-0" />
          <a
            href={`https://app.ens.domains/${cache.ensName}`}
            target="_blank"
            rel="noreferrer"
            className="font-mono text-sm text-hm-green hover:underline truncate"
            title={cache.ensName}
          >
            {cache.ensName}
          </a>
          {classifiedAt && (
            <span className="font-mono text-[9px] text-white/25 shrink-0">
              {new Date(classifiedAt).toLocaleDateString()}
            </span>
          )}
          {issuedBy && (
            <a
              href={`https://app.ens.domains/${issuedBy}`}
              target="_blank"
              rel="noreferrer"
              className="font-mono text-[9px] text-white/30 hover:text-hm-blue transition-colors shrink-0"
              title={`Issued by ${issuedBy}`}
            >
              · {issuedBy}
            </a>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {hasScore && (
            <div
              className="font-display font-extralight text-xl leading-none tabular-nums border border-white/[0.18] rounded-lg px-3 py-1.5"
              style={{ color: scoreColor }}
            >
              {scoreNum}<span className="text-[9px] text-white/20 ml-0.5">/100</span>
            </div>
          )}
          <a
            href={`https://sourcify.dev/#/lookup/${address}`}
            target="_blank"
            rel="noreferrer"
            className="text-[9px] tracking-[0.16em] uppercase border border-white/[0.18] rounded-md px-2.5 py-1.5 text-white/35 hover:border-white/25 hover:text-white/70 transition-colors"
          >
            Source ↗
          </a>
        </div>
      </div>

      {/* Records grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 divide-x divide-y divide-white/[0.05]">
        {pattern && <Cell label="Pattern" value={pattern} />}
        {sourcify && (
          <Cell
            label="Sourcify"
            value={sourcify === 'true' ? '✓ Verified' : sourcify === 'partial' ? '◐ Partial' : '✗ None'}
            color={sourcify === 'true' ? '#30d158' : sourcify === 'partial' ? '#ffd60a' : '#ff453a'}
          />
        )}
        {chains && <Cell label="Chain" value={chains} />}
        {ownerProject && <Cell label="Project" value={ownerProject} />}
        {flags && (
          <Cell
            label="Risk"
            value={flagList.length > 0 ? `${flagList.length} flag${flagList.length !== 1 ? 's' : ''}` : 'Clean'}
            color={flagList.length > 0 ? '#ffd60a' : '#30d158'}
          />
        )}
        {security && security !== '' && <Cell label="Security" value={security} />}
        {similarTo && <Cell label="Similar To" value={similarTo} />}
      </div>

      {/* Flag chips */}
      {flagList.length > 0 && (
        <div className="px-4 py-2.5 border-t border-white/[0.05] flex flex-wrap gap-1.5">
          {flagList.map((f) => (
            <span
              key={f}
              className="font-mono text-[8px] px-2 py-0.5 rounded border bg-[rgba(255,214,10,0.05)] border-[rgba(255,214,10,0.18)] text-hm-amber"
            >
              {f}
            </span>
          ))}
        </div>
      )}

      {/* Description */}
      {description && (
        <p className="px-5 py-3 border-t border-white/[0.05] text-[11px] text-white/50 leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
}

function Cell({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="px-4 py-2.5">
      <div className="text-[7px] font-light tracking-[0.24em] uppercase text-white/[0.16] mb-1">{label}</div>
      <div className="font-mono text-[10px] truncate" style={{ color: color ?? 'rgba(255,255,255,0.7)' }}>{value}</div>
    </div>
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
    <button onClick={copy} className="text-white/20 hover:text-white/60 transition-colors" title="Copy address">
      {copied
        ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#30d158" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
        : <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
      }
    </button>
  );
}

function ExternalIcon() {
  return <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>;
}

function ScoreIcon() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>;
}

function VerifyShieldIcon() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>;
}

function VerifiedIcon() {
  return <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>;
}

function UnverifiedIcon() {
  return <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;
}
