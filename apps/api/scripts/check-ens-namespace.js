/**
 * Verifies that:
 *   1. Your ENS parent name resolves on Sepolia
 *   2. Your wallet (from ENS_PRIVATE_KEY) owns it
 *   3. RPC + key are wired correctly
 *
 * Handles ENS V2 NameWrapper: when a .eth name is registered today, the
 * registry-level owner is the NameWrapper contract; the real owner is
 * looked up via NameWrapper.ownerOf(tokenId).
 */
import 'dotenv/config';
import { createPublicClient, http, namehash } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';

const ENS_REGISTRY = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e';
const NAME_WRAPPER_SEPOLIA = '0x0635513f179D50A207757E05759CbD106d7dFcE8';

const REGISTRY_ABI = [
  { name: 'owner', type: 'function', stateMutability: 'view', inputs: [{ name: 'node', type: 'bytes32' }], outputs: [{ type: 'address' }] },
  { name: 'resolver', type: 'function', stateMutability: 'view', inputs: [{ name: 'node', type: 'bytes32' }], outputs: [{ type: 'address' }] },
];

const NAME_WRAPPER_ABI = [
  { name: 'ownerOf', type: 'function', stateMutability: 'view', inputs: [{ name: 'id', type: 'uint256' }], outputs: [{ type: 'address' }] },
];

const namespace = process.env.ENS_NAMESPACE;
const rpcUrl = process.env.ENS_RPC_URL;
const privateKey = process.env.ENS_PRIVATE_KEY;

if (!namespace || !rpcUrl || !privateKey) {
  console.error('Missing ENS_NAMESPACE, ENS_RPC_URL, or ENS_PRIVATE_KEY in .env');
  process.exit(1);
}

const account = privateKeyToAccount(privateKey);
const client = createPublicClient({ chain: sepolia, transport: http(rpcUrl) });
const node = namehash(namespace);
const tokenId = BigInt(node);

const [registryOwner, resolver, balance] = await Promise.all([
  client.readContract({ address: ENS_REGISTRY, abi: REGISTRY_ABI, functionName: 'owner', args: [node] }),
  client.readContract({ address: ENS_REGISTRY, abi: REGISTRY_ABI, functionName: 'resolver', args: [node] }),
  client.getBalance({ address: account.address }),
]);

const isWrapped = registryOwner.toLowerCase() === NAME_WRAPPER_SEPOLIA.toLowerCase();
let realOwner = registryOwner;
if (isWrapped) {
  realOwner = await client.readContract({
    address: NAME_WRAPPER_SEPOLIA, abi: NAME_WRAPPER_ABI,
    functionName: 'ownerOf', args: [tokenId],
  });
}

console.log('--- ENS Namespace Check ---');
console.log('Namespace:               ', namespace);
console.log('Wallet:                  ', account.address);
console.log('Wallet balance:          ', `${Number(balance) / 1e18} ETH`);
console.log('Registry owner:          ', registryOwner);
console.log('Wrapped via NameWrapper? ', isWrapped ? 'yes' : 'no');
console.log('Real owner:              ', realOwner);
console.log('Resolver:                ', resolver);
console.log('Owned by you?            ', realOwner.toLowerCase() === account.address.toLowerCase() ? 'YES ✓' : 'NO ✗');

if (realOwner.toLowerCase() !== account.address.toLowerCase()) {
  console.error('\nThe wallet does not own the namespace. Cannot mint subnames.');
  process.exit(1);
}
console.log('\nReady to mint subnames.');
