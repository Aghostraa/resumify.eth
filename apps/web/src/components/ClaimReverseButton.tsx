import { useState, useEffect } from 'react';
import { createPublicClient, http, type Address } from 'viem';
import { sepolia } from 'viem/chains';
import { useWalletContext } from '../contexts/WalletContext';

const REVERSE_REGISTRAR = '0xA0a1AbcDAe1a2a4A2EF8e9113Ff0e02DD81DC0C6' as const;
const PUBLIC_RESOLVER = '0xE99638b40E4Fff0129D56f03b55b6bbC4BBE49b5' as const;

const OWNABLE_ABI = [
  { name: 'owner', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'address' }] },
] as const;

const REVERSE_REGISTRAR_ABI = [
  {
    name: 'setNameForAddr',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'addr', type: 'address' },
      { name: 'owner', type: 'address' },
      { name: 'resolver', type: 'address' },
      { name: 'name', type: 'string' },
    ],
    outputs: [{ type: 'bytes32' }],
  },
] as const;

const publicClient = createPublicClient({
  chain: sepolia,
  transport: http('https://sepolia.drpc.org'),
});

interface Props {
  contractAddress: string;
  ensName: string;
}

export default function ClaimReverseButton({ contractAddress, ensName }: Props) {
  const { address: walletAddress, walletClient } = useWalletContext();
  const [isOwner, setIsOwner] = useState(false);
  const [status, setStatus] = useState<'idle' | 'pending' | 'done' | 'error'>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);

  useEffect(() => {
    if (!walletAddress) { setIsOwner(false); return; }
    publicClient
      .readContract({ address: contractAddress as Address, abi: OWNABLE_ABI, functionName: 'owner' })
      .then((owner) => setIsOwner(owner.toLowerCase() === walletAddress.toLowerCase()))
      .catch(() => setIsOwner(false));
  }, [walletAddress, contractAddress]);

  if (!walletAddress || !isOwner || !walletClient) return null;

  async function claim() {
    if (!walletClient || !walletAddress) return;
    setStatus('pending');
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const hash = await (walletClient as any).writeContract({
        address: REVERSE_REGISTRAR,
        abi: REVERSE_REGISTRAR_ABI,
        functionName: 'setNameForAddr',
        args: [contractAddress as Address, walletAddress, PUBLIC_RESOLVER, ensName],
        chain: sepolia,
      });
      setTxHash(hash);
      await publicClient.waitForTransactionReceipt({ hash, timeout: 120_000 });
      setStatus('done');
    } catch (err) {
      console.error('[ClaimReverse]', err);
      setStatus('error');
    }
  }

  if (status === 'done') {
    return (
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-hm-green" />
        <span className="text-[9px] tracking-[0.18em] uppercase text-hm-green">Reverse set</span>
        {txHash && (
          <a
            href={`https://sepolia.etherscan.io/tx/${txHash}`}
            target="_blank"
            rel="noreferrer"
            className="text-[9px] tracking-[0.18em] uppercase text-white/30 hover:text-white transition-colors"
          >
            View tx
          </a>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={claim}
      disabled={status === 'pending'}
      className="text-[9px] tracking-[0.22em] uppercase border border-hm-blue/30 rounded-md px-3 py-1.5 text-hm-blue hover:border-hm-blue/60 hover:text-hm-blue transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {status === 'pending' ? 'Claiming…' : status === 'error' ? 'Failed — retry' : 'Claim Reverse Name'}
    </button>
  );
}
