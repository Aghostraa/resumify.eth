import { createWalletClient, createPublicClient, http, namehash } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';

const ENS_NAMESPACE = process.env.ENS_NAMESPACE ?? 'contractid.eth';
const ENS_RPC_URL = process.env.ENS_RPC_URL;
const ENS_PRIVATE_KEY = process.env.ENS_PRIVATE_KEY;

const ENS_REGISTRY = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e';
const NAME_WRAPPER_SEPOLIA = '0x0635513f179D50A207757E05759CbD106d7dFcE8';
const PUBLIC_RESOLVER_SEPOLIA = '0x8FADE66B79cC9f707aB26799354482EB93a5B7dD';

const REGISTRY_ABI = [
  { name: 'owner', type: 'function', stateMutability: 'view',
    inputs: [{ name: 'node', type: 'bytes32' }], outputs: [{ type: 'address' }] },
];

const NAME_WRAPPER_ABI = [
  { name: 'ownerOf', type: 'function', stateMutability: 'view',
    inputs: [{ name: 'id', type: 'uint256' }], outputs: [{ type: 'address' }] },
  { name: 'getData', type: 'function', stateMutability: 'view',
    inputs: [{ name: 'id', type: 'uint256' }],
    outputs: [
      { name: 'owner', type: 'address' },
      { name: 'fuses', type: 'uint32' },
      { name: 'expiry', type: 'uint64' },
    ] },
  { name: 'setSubnodeRecord', type: 'function', stateMutability: 'nonpayable',
    inputs: [
      { name: 'parentNode', type: 'bytes32' },
      { name: 'label', type: 'string' },
      { name: 'owner', type: 'address' },
      { name: 'resolver', type: 'address' },
      { name: 'ttl', type: 'uint64' },
      { name: 'fuses', type: 'uint32' },
      { name: 'expiry', type: 'uint64' },
    ],
    outputs: [{ type: 'bytes32' }] },
];

const RESOLVER_ABI = [
  { name: 'setText', type: 'function', stateMutability: 'nonpayable',
    inputs: [
      { name: 'node', type: 'bytes32' },
      { name: 'key', type: 'string' },
      { name: 'value', type: 'string' },
    ],
    outputs: [] },
];

export async function mintEnsIdentity({ address, classification, score, sourcify }) {
  if (!ENS_PRIVATE_KEY || !ENS_RPC_URL) {
    throw new Error('ENS_PRIVATE_KEY or ENS_RPC_URL not set — skipping mint');
  }

  const account = privateKeyToAccount(ENS_PRIVATE_KEY);
  const walletClient = createWalletClient({ account, chain: sepolia, transport: http(ENS_RPC_URL) });
  const publicClient = createPublicClient({ chain: sepolia, transport: http(ENS_RPC_URL) });

  const chainId = await publicClient.getChainId();
  console.log(`        ENS RPC chainId=${chainId}`);
  if (chainId !== 11155111) {
    throw new Error(`ENS_RPC_URL points to chainId=${chainId} but we need Sepolia (11155111).`);
  }

  // Build subname
  const shortHash = address.slice(2, 8).toLowerCase();
  const patternSlug = (classification?.pattern ?? 'unknown').toLowerCase().replace(/[^a-z0-9-]/g, '');
  const subLabel = `${shortHash}-${patternSlug}`;
  const fullName = `${subLabel}.${ENS_NAMESPACE}`;
  const parentNode = namehash(ENS_NAMESPACE);
  const subnameNode = namehash(fullName);
  const parentTokenId = BigInt(parentNode);

  // Detect wrapped state
  const registryOwner = await publicClient.readContract({
    address: ENS_REGISTRY, abi: REGISTRY_ABI,
    functionName: 'owner', args: [parentNode],
  });
  const isWrapped = registryOwner.toLowerCase() === NAME_WRAPPER_SEPOLIA.toLowerCase();
  console.log(`        parent wrapped=${isWrapped}`);

  if (!isWrapped) {
    throw new Error(`Parent ${ENS_NAMESPACE} is not wrapped. This flow requires a NameWrapper-managed name.`);
  }

  // Get parent expiry so subname expiry stays within bounds
  const parentData = await publicClient.readContract({
    address: NAME_WRAPPER_SEPOLIA, abi: NAME_WRAPPER_ABI,
    functionName: 'getData', args: [parentTokenId],
  });
  const parentExpiry = parentData[2];

  console.log(`        creating subname ${fullName}…`);
  const subnameTx = await walletClient.writeContract({
    address: NAME_WRAPPER_SEPOLIA, abi: NAME_WRAPPER_ABI,
    functionName: 'setSubnodeRecord',
    args: [parentNode, subLabel, account.address, PUBLIC_RESOLVER_SEPOLIA, 0n, 0, parentExpiry],
  });
  console.log(`        subname tx broadcast: ${subnameTx}`);
  await publicClient.waitForTransactionReceipt({ hash: subnameTx, timeout: 120_000 });
  console.log(`        subname tx mined`);

  // Write text records
  const records = buildTextRecords({ classification, score, sourcify });
  const txHashes = [subnameTx];

  for (const [key, value] of Object.entries(records)) {
    if (!value) continue;
    const tx = await walletClient.writeContract({
      address: PUBLIC_RESOLVER_SEPOLIA, abi: RESOLVER_ABI,
      functionName: 'setText',
      args: [subnameNode, key, value],
    });
    console.log(`        setText[${key}] tx: ${tx}`);
    await publicClient.waitForTransactionReceipt({ hash: tx, timeout: 120_000 });
    txHashes.push(tx);
  }

  return {
    name: fullName,
    namehash: subnameNode,
    owner: account.address,
    resolver: PUBLIC_RESOLVER_SEPOLIA,
    records,
    txHash: subnameTx,
    txHashes,
    explorerUrl: `https://sepolia.etherscan.io/tx/${subnameTx}`,
  };
}

function buildTextRecords({ classification, score, sourcify }) {
  const flagIds = (classification?.riskFlags ?? []).map((f) => f.id).join(',') || 'none';
  return {
    'trust-score': score.label,
    pattern: classification?.pattern ?? 'unknown',
    'sourcify-verified': sourcify?.verified ? 'true' : sourcify?.partial ? 'partial' : 'false',
    'risk-flags': flagIds,
    chains: 'sepolia',
    'similar-to': '',
    'classified-at': new Date().toISOString(),
    description: classification?.reasoning ?? '',
  };
}
