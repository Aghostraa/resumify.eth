import { useState, type FormEvent } from 'react';
import type { DeployedContract, VerifyStatus } from '../types';
import { chainName } from '../utils/chains';

interface Props {
  contract: DeployedContract;
  onClose: () => void;
  onVerified: (address: string, chainId: number) => void;
}

export default function VerifyModal({ contract, onClose, onVerified }: Props) {
  const [metadataRaw, setMetadataRaw] = useState('');
  const [sourcesRaw, setSourcesRaw] = useState('');
  const [status, setStatus] = useState<VerifyStatus>('idle');
  const [message, setMessage] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    let metadata: object;
    let sources: Record<string, string>;

    try {
      metadata = JSON.parse(metadataRaw);
    } catch {
      setMessage('Invalid metadata JSON');
      return;
    }
    try {
      sources = JSON.parse(sourcesRaw);
    } catch {
      setMessage('Invalid sources JSON');
      return;
    }

    setStatus('submitting');
    setMessage('Submitting to Sourcify…');

    let verificationId: string;
    try {
      const res = await fetch(`/api/verify/metadata/${contract.chainId}/${contract.address}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metadata, sources }),
      });
      const data = await res.json() as { verificationId?: string; message?: string; error?: string };

      if (!res.ok || !data.verificationId) {
        setStatus('error');
        setMessage(data.message ?? data.error ?? 'Submission failed');
        return;
      }
      verificationId = data.verificationId;
    } catch (err) {
      setStatus('error');
      setMessage(String(err));
      return;
    }

    setStatus('polling');
    setMessage(`Polling verification job ${verificationId}…`);

    try {
      const res = await fetch(`/api/verify/wait/${verificationId}`);
      const data = await res.json() as { contract?: { match?: string }; errorMessage?: string };

      if (data.errorMessage) {
        setStatus('error');
        setMessage(data.errorMessage);
        return;
      }

      setStatus('done');
      setMessage(`Verified! Match: ${data.contract?.match ?? 'full_match'}`);
      onVerified(contract.address, contract.chainId);
    } catch (err) {
      setStatus('error');
      setMessage(String(err));
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-ink-800 border border-ink-600 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl animate-slide-up">
        <div className="flex items-center justify-between p-4 border-b border-ink-600">
          <div>
            <h3 className="font-semibold text-ink-100">Verify Contract</h3>
            <p className="font-mono text-xs text-ink-400 mt-0.5">
              {chainName(contract.chainId)} · {contract.address.slice(0, 10)}…{contract.address.slice(-6)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-ink-500 hover:text-ink-100 transition-colors p-1"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block font-mono text-xs text-ink-400 mb-1.5">
              metadata.json <span className="text-ink-600">(compiler output)</span>
            </label>
            <textarea
              value={metadataRaw}
              onChange={(e) => setMetadataRaw(e.target.value)}
              placeholder='{"compiler":{"version":"0.8.19+commit..."},"language":"Solidity",...}'
              rows={6}
              className="w-full bg-ink-900 border border-ink-600 rounded-md p-3 font-mono text-xs text-ink-200
                         placeholder-ink-600 focus:outline-none focus:border-acid-500 focus:ring-1 focus:ring-acid-500/30
                         resize-y transition-colors"
              disabled={status === 'submitting' || status === 'polling' || status === 'done'}
            />
          </div>

          <div>
            <label className="block font-mono text-xs text-ink-400 mb-1.5">
              sources <span className="text-ink-600">{`{ "contracts/Foo.sol": "pragma solidity..." }`}</span>
            </label>
            <textarea
              value={sourcesRaw}
              onChange={(e) => setSourcesRaw(e.target.value)}
              placeholder='{"contracts/MyContract.sol": "// SPDX-License-Identifier: MIT\npragma solidity ^0.8.0;\n..."}'
              rows={6}
              className="w-full bg-ink-900 border border-ink-600 rounded-md p-3 font-mono text-xs text-ink-200
                         placeholder-ink-600 focus:outline-none focus:border-acid-500 focus:ring-1 focus:ring-acid-500/30
                         resize-y transition-colors"
              disabled={status === 'submitting' || status === 'polling' || status === 'done'}
            />
          </div>

          {message && (
            <div className={`font-mono text-xs px-3 py-2 rounded border ${
              status === 'error'
                ? 'bg-rose-400/10 border-rose-400/30 text-rose-400'
                : status === 'done'
                ? 'bg-acid-500/10 border-acid-500/30 text-acid-400'
                : 'bg-ink-700 border-ink-600 text-ink-300'
            }`}>
              {status === 'polling' && <span className="inline-block w-2 h-2 bg-amber-400 rounded-full mr-2 animate-pulse-slow" />}
              {message}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-mono text-sm text-ink-400 hover:text-ink-100 transition-colors"
            >
              cancel
            </button>
            <button
              type="submit"
              disabled={status === 'submitting' || status === 'polling' || status === 'done' || !metadataRaw || !sourcesRaw}
              className="px-5 py-2 bg-acid-500 hover:bg-acid-400 disabled:bg-ink-700 disabled:text-ink-500
                         text-ink-950 font-mono font-semibold text-sm rounded-md transition-colors
                         disabled:cursor-not-allowed"
            >
              {status === 'submitting' || status === 'polling' ? 'verifying…' : status === 'done' ? 'verified ✓' : 'submit →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
