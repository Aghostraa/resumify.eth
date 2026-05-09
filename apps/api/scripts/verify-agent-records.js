/**
 * Reads the agent ENS subname state directly from-chain and prints
 * registry owner, registry resolver, and the actual text records.
 * Bypasses the ENS app UI for ground truth.
 */
import 'dotenv/config';
import { createPublicClient, http, namehash } from 'viem';
import { sepolia } from 'viem/chains';

const ENS_RPC_URL = process.env.ENS_RPC_URL;
const ENS_NAMESPACE = process.env.ENS_NAMESPACE;
const AGENT_LABEL = (process.argv[2] ?? 'analyzer').toLowerCase();

const ENS_REGISTRY = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e';
const NAME_WRAPPER_SEPOLIA = '0x0635513f179D50A207757E05759CbD106d7dFcE8';
const PUBLIC_RESOLVER_SEPOLIA = '0x8FADE66B79cC9f707aB26799354482EB93a5B7dD';

const REGISTRY_ABI = [
  { name: 'resolver', type: 'function', stateMutability: 'view',
    inputs: [{ name: 'node', type: 'bytes32' }], outputs: [{ type: 'address' }] },
  { name: 'owner', type: 'function', stateMutability: 'view',
    inputs: [{ name: 'node', type: 'bytes32' }], outputs: [{ type: 'address' }] },
];

const RESOLVER_ABI = [
  { name: 'text', type: 'function', stateMutability: 'view',
    inputs: [{ name: 'node', type: 'bytes32' }, { name: 'key', type: 'string' }],
    outputs: [{ type: 'string' }] },
];

const NAME_WRAPPER_ABI = [
  { name: 'ownerOf', type: 'function', stateMutability: 'view',
    inputs: [{ name: 'id', type: 'uint256' }], outputs: [{ type: 'address' }] },
];

if (!ENS_RPC_URL || !ENS_NAMESPACE) {
  console.error('Missing ENS_RPC_URL or ENS_NAMESPACE in .env');
  process.exit(1);
}

const fullName = `${AGENT_LABEL}.${ENS_NAMESPACE}`;
const subnode = namehash(fullName);
const tokenId = BigInt(subnode);

const pc = createPublicClient({ chain: sepolia, transport: http(ENS_RPC_URL) });

console.log(`=== Verifying ${fullName} ===\n`);

const [registryOwner, registryResolver] = await Promise.all([
  pc.readContract({ address: ENS_REGISTRY, abi: REGISTRY_ABI, functionName: 'owner', args: [subnode] }),
  pc.readContract({ address: ENS_REGISTRY, abi: REGISTRY_ABI, functionName: 'resolver', args: [subnode] }),
]);

console.log(`Registry owner:    ${registryOwner}`);
console.log(`Registry resolver: ${registryResolver}`);
console.log(`Public Resolver:   ${PUBLIC_RESOLVER_SEPOLIA}`);
console.log(`NameWrapper:       ${NAME_WRAPPER_SEPOLIA}`);

if (registryOwner.toLowerCase() === '0x0000000000000000000000000000000000000000') {
  console.error('\n✗ Registry owner is 0x0 — subname does NOT exist. Re-run the bootstrap script.');
  process.exit(1);
}

if (registryOwner.toLowerCase() === NAME_WRAPPER_SEPOLIA.toLowerCase()) {
  const wrappedOwner = await pc.readContract({
    address: NAME_WRAPPER_SEPOLIA, abi: NAME_WRAPPER_ABI,
    functionName: 'ownerOf', args: [tokenId],
  });
  console.log(`Wrapped owner:     ${wrappedOwner}`);
}

const resolverMatches = registryResolver.toLowerCase() === PUBLIC_RESOLVER_SEPOLIA.toLowerCase();
console.log(`\nRegistry resolver matches PublicResolver? ${resolverMatches ? 'YES ✓' : 'NO ✗'}`);

const keys = ['name', 'description', 'agent-context', 'agent-endpoint[web]'];
console.log(`\n--- Reading text records from registry resolver (${registryResolver}) ---`);
for (const key of keys) {
  try {
    const value = await pc.readContract({
      address: registryResolver, abi: RESOLVER_ABI,
      functionName: 'text', args: [subnode, key],
    });
    const display = value ? `"${value.slice(0, 80)}${value.length > 80 ? '…' : ''}"` : '(empty)';
    console.log(`  ${key}: ${display}`);
  } catch (err) {
    console.log(`  ${key}: ERROR ${err.shortMessage ?? err.message}`);
  }
}

if (!resolverMatches) {
  console.log(`\n--- Reading text records from PublicResolver directly (${PUBLIC_RESOLVER_SEPOLIA}) ---`);
  for (const key of keys) {
    try {
      const value = await pc.readContract({
        address: PUBLIC_RESOLVER_SEPOLIA, abi: RESOLVER_ABI,
        functionName: 'text', args: [subnode, key],
      });
      const display = value ? `"${value.slice(0, 80)}${value.length > 80 ? '…' : ''}"` : '(empty)';
      console.log(`  ${key}: ${display}`);
    } catch (err) {
      console.log(`  ${key}: ERROR ${err.shortMessage ?? err.message}`);
    }
  }
}
