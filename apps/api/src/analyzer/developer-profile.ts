import { createWalletClient, createPublicClient, http, namehash, encodeFunctionData, type Hex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';

const NAMESPACE = process.env.ENS_NAMESPACE ?? 'hallmarked.eth';
export const NAME_WRAPPER_SEPOLIA = '0x0635513f179D50A207757E05759CbD106d7dFcE8' as const;
export const PUBLIC_RESOLVER_SEPOLIA = '0x8FADE66B79cC9f707aB26799354482EB93a5B7dD' as const;

const NAME_WRAPPER_ABI = [
  {
    name: 'getData',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'id', type: 'uint256' }],
    outputs: [
      { name: 'owner', type: 'address' },
      { name: 'fuses', type: 'uint32' },
      { name: 'expiry', type: 'uint64' },
    ],
  },
  {
    name: 'setSubnodeRecord',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'parentNode', type: 'bytes32' },
      { name: 'label', type: 'string' },
      { name: 'owner', type: 'address' },
      { name: 'resolver', type: 'address' },
      { name: 'ttl', type: 'uint64' },
      { name: 'fuses', type: 'uint32' },
      { name: 'expiry', type: 'uint64' },
    ],
    outputs: [{ type: 'bytes32' }],
  },
] as const;

const RESOLVER_ABI = [
  {
    name: 'setText',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'node', type: 'bytes32' },
      { name: 'key', type: 'string' },
      { name: 'value', type: 'string' },
    ],
    outputs: [],
  },
  {
    name: 'multicall',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'data', type: 'bytes[]' }],
    outputs: [{ name: 'results', type: 'bytes[]' }],
  },
] as const;

export interface DeveloperProfile {
  developerAddress: string;
  label: string;
  profileName: string;
  resumeName: string;
  txHashes: { profile: string; resume: string; setText: string };
}

export function deriveDeveloperLabel(address: string, ensName?: string | null): string {
  if (ensName) {
    const withoutEth = ensName.replace(/\.eth$/i, '');
    const label = withoutEth
      .split('.')
      .join('-')
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '')
      .replace(/^-|-$/g, '')
      .slice(0, 32);
    if (label) return label;
  }
  return `addr${address.slice(2, 10).toLowerCase()}`;
}

function getAgentClients() {
  const rpcUrl = process.env.RPC_URL_SEPOLIA ?? process.env.ENS_RPC_URL;
  const pk = process.env.ENS_PRIVATE_KEY as Hex | undefined;
  if (!rpcUrl || !pk) throw new Error('Missing RPC_URL_SEPOLIA or ENS_PRIVATE_KEY');
  const account = privateKeyToAccount(pk);
  const walletClient = createWalletClient({ account, chain: sepolia, transport: http(rpcUrl) });
  const publicClient = createPublicClient({ chain: sepolia, transport: http(rpcUrl) });
  return { account, walletClient, publicClient };
}

export async function registerDeveloperProfile(
  developerAddress: string,
  ensName?: string | null,
): Promise<DeveloperProfile> {
  const { account, walletClient, publicClient } = getAgentClients();
  const label = deriveDeveloperLabel(developerAddress, ensName);
  const profileName = `${label}.${NAMESPACE}`;
  const resumeName = `resume.${profileName}`;

  const nsNode = namehash(NAMESPACE);
  const profileNode = namehash(profileName);

  const parentData = await publicClient.readContract({
    address: NAME_WRAPPER_SEPOLIA,
    abi: NAME_WRAPPER_ABI,
    functionName: 'getData',
    args: [BigInt(nsNode)],
  }) as [string, number, bigint];
  const expiry = parentData[2];

  // 1. {devLabel}.hallmarked.eth — agent-owned developer passport
  console.log(`[devprofile] registering ${profileName}…`);
  const profileTx = await walletClient.writeContract({
    address: NAME_WRAPPER_SEPOLIA,
    abi: NAME_WRAPPER_ABI,
    functionName: 'setSubnodeRecord',
    args: [nsNode, label, account.address, PUBLIC_RESOLVER_SEPOLIA, 0n, 0, expiry],
  });
  await publicClient.waitForTransactionReceipt({ hash: profileTx, timeout: 120_000 });

  // 2. resume.{devLabel}.hallmarked.eth — agent-owned contract resume namespace
  console.log(`[devprofile] registering ${resumeName}…`);
  const resumeTx = await walletClient.writeContract({
    address: NAME_WRAPPER_SEPOLIA,
    abi: NAME_WRAPPER_ABI,
    functionName: 'setSubnodeRecord',
    args: [profileNode, 'resume', account.address, PUBLIC_RESOLVER_SEPOLIA, 0n, 0, expiry],
  });
  await publicClient.waitForTransactionReceipt({ hash: resumeTx, timeout: 120_000 });

  // 3. Write deployer + metadata text records on both profile and resume namespace
  const profileNode32 = namehash(profileName);
  const resumeNode32 = namehash(resumeName);
  const agentEnsName = process.env.AGENT_ENS_NAME ?? '';
  const calls = [
    encodeFunctionData({ abi: RESOLVER_ABI, functionName: 'setText', args: [profileNode32, 'deployer', developerAddress] }),
    encodeFunctionData({ abi: RESOLVER_ABI, functionName: 'setText', args: [profileNode32, 'purpose', 'contract-resume'] }),
    encodeFunctionData({ abi: RESOLVER_ABI, functionName: 'setText', args: [profileNode32, 'hallmark-version', '1.0'] }),
    encodeFunctionData({ abi: RESOLVER_ABI, functionName: 'setText', args: [resumeNode32, 'deployer', developerAddress] }),
    encodeFunctionData({ abi: RESOLVER_ABI, functionName: 'setText', args: [resumeNode32, 'purpose', 'contract-resume'] }),
    ...(agentEnsName
      ? [
          encodeFunctionData({ abi: RESOLVER_ABI, functionName: 'setText', args: [profileNode32, 'issued-by', agentEnsName] }),
          encodeFunctionData({ abi: RESOLVER_ABI, functionName: 'setText', args: [resumeNode32, 'issued-by', agentEnsName] }),
        ]
      : []),
  ];

  const textTx = await walletClient.writeContract({
    address: PUBLIC_RESOLVER_SEPOLIA,
    abi: RESOLVER_ABI,
    functionName: 'multicall',
    args: [calls],
  });
  await publicClient.waitForTransactionReceipt({ hash: textTx, timeout: 120_000 });
  console.log(`[devprofile] done: ${profileName}`);

  return { developerAddress, label, profileName, resumeName, txHashes: { profile: profileTx, resume: resumeTx, setText: textTx } };
}
