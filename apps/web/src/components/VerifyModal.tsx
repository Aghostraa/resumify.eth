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
      const data = (await res.json()) as { verificationId?: string; message?: string; error?: string };

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
      const data = (await res.json()) as { contract?: { match?: string }; errorMessage?: string };

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-black hm-card w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-fade-up">
        <div className="flex items-center justify-between p-5 border-b border-white/[0.07]">
          <div>
            <h3 className="font-display font-extralight text-lg text-white tracking-[0.04em]">Verify Contract</h3>
            <p className="font-mono text-xs text-white/40 mt-1">
              {chainName(contract.chainId)} · {contract.address.slice(0, 10)}…{contract.address.slice(-6)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors p-1"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-[10px] font-light tracking-[0.22em] uppercase text-white/40 mb-2">
              metadata.json <span className="text-white/[0.18]">(compiler output)</span>
            </label>
            <textarea
              value={metadataRaw}
              onChange={(e) => setMetadataRaw(e.target.value)}
              placeholder='{"compiler":{"version":"0.8.19+commit..."},"language":"Solidity",...}'
              rows={6}
              className="w-full bg-white/[0.025] border border-white/[0.07] rounded-md p-3 font-mono text-xs text-white/85 placeholder-white/[0.18] focus:outline-none focus:border-white/30 resize-y transition-colors"
              disabled={status === 'submitting' || status === 'polling' || status === 'done'}
            />
          </div>

          <div>
            <label className="block text-[10px] font-light tracking-[0.22em] uppercase text-white/40 mb-2">
              sources <span className="text-white/[0.18]">{`{ "contracts/Foo.sol": "pragma solidity..." }`}</span>
            </label>
            <textarea
              value={sourcesRaw}
              onChange={(e) => setSourcesRaw(e.target.value)}
              placeholder='{"contracts/MyContract.sol": "// SPDX-License-Identifier: MIT\npragma solidity ^0.8.0;\n..."}'
              rows={6}
              className="w-full bg-white/[0.025] border border-white/[0.07] rounded-md p-3 font-mono text-xs text-white/85 placeholder-white/[0.18] focus:outline-none focus:border-white/30 resize-y transition-colors"
              disabled={status === 'submitting' || status === 'polling' || status === 'done'}
            />
          </div>

          {message && (
            <div
              className={`font-mono text-xs px-3 py-2 rounded-md border ${
                status === 'error'
                  ? 'bg-[rgba(255,69,58,0.07)] border-[rgba(255,69,58,0.25)] text-hm-red'
                  : status === 'done'
                  ? 'bg-[rgba(48,209,88,0.07)] border-[rgba(48,209,88,0.20)] text-hm-green'
                  : 'bg-white/[0.025] border-white/[0.07] text-white/55'
              }`}
            >
              {status === 'polling' && (
                <span className="inline-block w-1.5 h-1.5 bg-hm-amber rounded-full mr-2 animate-pulse-slow" />
              )}
              {message}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="text-[10px] font-light tracking-[0.22em] uppercase px-4 py-2 text-white/40 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={status === 'submitting' || status === 'polling' || status === 'done' || !metadataRaw || !sourcesRaw}
              className="hm-input-btn"
              style={{ padding: '10px 24px' }}
            >
              {status === 'submitting' || status === 'polling'
                ? 'Verifying…'
                : status === 'done'
                ? 'Verified ✓'
                : 'Submit →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
