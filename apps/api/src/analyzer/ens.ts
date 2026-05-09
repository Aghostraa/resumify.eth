import { nameContract, getContractAddresses, type NameContractResult } from '@enscribe/enscribe';
import { createWalletClient, createPublicClient, http, namehash, type Hex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { mainnet, sepolia, base, baseSepolia, optimism, arbitrum, linea } from 'viem/chains';
import { TEXT_RECORD_KEYS, type SecurityFinding } from '@contractid/core';
import { getNetwork, type NetworkConfig } from '@contractid/config';

const VIEM_CHAINS = {
  1: mainnet,
  11155111: sepolia,
  8453: base,
  84532: baseSepolia,
  10: optimism,
  42161: arbitrum,
  59144: linea,
} as const;

const RESOLVER_TEXT_ABI = [
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
] as const;

export interface MintInputs {
  address: string;
  chainId: number;
  classification: {
    pattern?: string;
    riskFlags?: { id: string; severity: 'high' | 'medium' | 'low' }[];
    reasoning?: string;
  } | null;
  score: { label: string; total: number };
  sourcify: { verified?: boolean; partial?: boolean } | null;
  security: SecurityFinding[];
  oli?: { ownerProject?: string; similarTo?: string[] } | null;
  description?: string;
}

export interface MintResult {
  name: string;
  namehash: string;
  owner: string;
  resolver: string;
  records: Record<string, string>;
  contractType: 'Ownable' | 'ReverseClaimer' | 'Unknown';
  forwardSet: boolean;
  reverseSet: boolean;
  txHashes: { subname?: string; forward?: string; reverse?: string; setText: string[] };
  explorerUrl: string;
}

function clientsForChain(network: NetworkConfig) {
  const rpcUrl = process.env[network.rpcUrlEnvKey];
  if (!rpcUrl) throw new Error(`Missing RPC URL env: ${network.rpcUrlEnvKey}`);
  const pk = process.env.ENS_PRIVATE_KEY as Hex | undefined;
  if (!pk) throw new Error('ENS_PRIVATE_KEY not set');

  const chain = VIEM_CHAINS[network.chainId as keyof typeof VIEM_CHAINS];
  if (!chain) throw new Error(`No viem chain for ${network.name}`);

  const account = privateKeyToAccount(pk);
  const walletClient = createWalletClient({ account, chain, transport: http(rpcUrl) });
  const publicClient = createPublicClient({ chain, transport: http(rpcUrl) });
  return { account, walletClient, publicClient };
}

function buildSubname(address: string, pattern: string | undefined, parent: string): { label: string; full: string } {
  const shortHash = address.slice(2, 8).toLowerCase();
  const slug = (pattern ?? 'unknown').toLowerCase().replace(/[^a-z0-9-]/g, '') || 'unknown';
  const label = `${shortHash}-${slug}`;
  return { label, full: `${label}.${parent}` };
}

function buildTextRecords(inputs: MintInputs, network: NetworkConfig): Record<string, string> {
  const flagIds = (inputs.classification?.riskFlags ?? []).map((f) => f.id).join(',') || 'none';
  const securityStr = inputs.security
    .map((f) => `${f.check}:${f.passed ? 'safe' : 'fail'}`)
    .join(',');
  const sourcifyStatus = inputs.sourcify?.verified
    ? 'true'
    : inputs.sourcify?.partial
      ? 'partial'
      : 'false';

  const records: Record<string, string> = {
    [TEXT_RECORD_KEYS.trustScore]: inputs.score.label,
    [TEXT_RECORD_KEYS.pattern]: inputs.classification?.pattern ?? 'unknown',
    [TEXT_RECORD_KEYS.sourcifyVerified]: sourcifyStatus,
    [TEXT_RECORD_KEYS.riskFlags]: flagIds,
    [TEXT_RECORD_KEYS.securityFindings]: securityStr,
    [TEXT_RECORD_KEYS.ethguardVersion]: '1.0',
    [TEXT_RECORD_KEYS.chains]: network.name,
    [TEXT_RECORD_KEYS.classifiedAt]: new Date().toISOString(),
    [TEXT_RECORD_KEYS.description]: inputs.description ?? inputs.classification?.reasoning ?? '',
    [TEXT_RECORD_KEYS.url]: `https://contractid.app/c/${network.chainId}/${inputs.address}`,
  };
  if (inputs.oli?.ownerProject) records[TEXT_RECORD_KEYS.ownerProject] = inputs.oli.ownerProject;
  if (inputs.oli?.similarTo?.length) records[TEXT_RECORD_KEYS.similarTo] = inputs.oli.similarTo.join(',');
  return records;
}

export async function mintEnsIdentity(inputs: MintInputs): Promise<MintResult> {
  const network = getNetwork(inputs.chainId);
  const { account, walletClient, publicClient } = clientsForChain(network);

  const { full } = buildSubname(inputs.address, inputs.classification?.pattern, network.ensParent);
  const subnameNode = namehash(full);

  const namingResult: NameContractResult = await nameContract({
    name: full,
    contractAddress: inputs.address,
    walletClient: walletClient as never,
    chainName: network.enscribeChainName,
  });

  const ensContracts = getContractAddresses(network.enscribeChainName as never);
  const resolverAddress = ensContracts.PUBLIC_RESOLVER as `0x${string}`;

  const records = buildTextRecords(inputs, network);
  const setTextHashes: string[] = [];
  for (const [key, value] of Object.entries(records)) {
    if (!value) continue;
    const tx = await walletClient.writeContract({
      address: resolverAddress,
      abi: RESOLVER_TEXT_ABI,
      functionName: 'setText',
      args: [subnameNode, key, value],
    });
    await publicClient.waitForTransactionReceipt({ hash: tx, timeout: 120_000 });
    setTextHashes.push(tx);
  }

  return {
    name: full,
    namehash: subnameNode,
    owner: account.address,
    resolver: resolverAddress,
    records,
    contractType: namingResult.contractType,
    forwardSet: !!namingResult.transactions.forwardResolution || namingResult.success,
    reverseSet: !!namingResult.transactions.reverseResolution,
    txHashes: {
      subname: namingResult.transactions.subname,
      forward: namingResult.transactions.forwardResolution,
      reverse: namingResult.transactions.reverseResolution,
      setText: setTextHashes,
    },
    explorerUrl: namingResult.explorerUrl,
  };
}
