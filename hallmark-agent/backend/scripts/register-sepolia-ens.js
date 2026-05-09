/**
 * Programmatic Sepolia .eth registration via ETHRegistrarController.
 * Bypasses the ENS app UI (which has had v2-rollout bugs in 2026).
 *
 * Usage from /backend:
 *   node scripts/register-sepolia-ens.js                 → defaults to contractid-demo
 *   node scripts/register-sepolia-ens.js my-name         → registers my-name.eth
 *
 * Requires ENS_RPC_URL (Sepolia) and ENS_PRIVATE_KEY in .env.
 */
import 'dotenv/config';
import {
  createPublicClient,
  createWalletClient,
  http,
  formatEther,
} from 'viem';
import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts';
import { sepolia } from 'viem/chains';

const RPC_URL = process.env.ENS_RPC_URL;
const PRIVATE_KEY = process.env.ENS_PRIVATE_KEY;
const NAME = (process.argv[2] ?? 'contractid-demo').toLowerCase().replace(/\.eth$/, '');
const DURATION = 31_536_000n; // 1 year

// Sepolia ENS deployment (per ens.domains/learn/deployments)
const ETH_REGISTRAR_CONTROLLER = '0xFED6a969AaA60E4961FCD3EBF1A2e8913ac65B72';
const PUBLIC_RESOLVER = '0x8FADE66B79cC9f707aB26799354482EB93a5B7dD';

const CONTROLLER_ABI = [
  { name: 'available', type: 'function', stateMutability: 'view',
    inputs: [{ name: 'name', type: 'string' }], outputs: [{ type: 'bool' }] },
  { name: 'rentPrice', type: 'function', stateMutability: 'view',
    inputs: [{ name: 'name', type: 'string' }, { name: 'duration', type: 'uint256' }],
    outputs: [{ type: 'tuple', components: [
      { name: 'base', type: 'uint256' },
      { name: 'premium', type: 'uint256' },
    ]}] },
  { name: 'minCommitmentAge', type: 'function', stateMutability: 'view',
    inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'maxCommitmentAge', type: 'function', stateMutability: 'view',
    inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'makeCommitment', type: 'function', stateMutability: 'pure',
    inputs: [
      { name: 'name', type: 'string' },
      { name: 'owner', type: 'address' },
      { name: 'duration', type: 'uint256' },
      { name: 'secret', type: 'bytes32' },
      { name: 'resolver', type: 'address' },
      { name: 'data', type: 'bytes[]' },
      { name: 'reverseRecord', type: 'bool' },
      { name: 'ownerControlledFuses', type: 'uint16' },
    ],
    outputs: [{ type: 'bytes32' }] },
  { name: 'commit', type: 'function', stateMutability: 'nonpayable',
    inputs: [{ name: 'commitment', type: 'bytes32' }], outputs: [] },
  { name: 'register', type: 'function', stateMutability: 'payable',
    inputs: [
      { name: 'name', type: 'string' },
      { name: 'owner', type: 'address' },
      { name: 'duration', type: 'uint256' },
      { name: 'secret', type: 'bytes32' },
      { name: 'resolver', type: 'address' },
      { name: 'data', type: 'bytes[]' },
      { name: 'reverseRecord', type: 'bool' },
      { name: 'ownerControlledFuses', type: 'uint16' },
    ],
    outputs: [] },
];

function fail(msg) {
  console.error(`\n✗ ${msg}`);
  process.exit(1);
}

if (!RPC_URL || !PRIVATE_KEY) fail('Missing ENS_RPC_URL or ENS_PRIVATE_KEY in backend/.env');

const account = privateKeyToAccount(PRIVATE_KEY);
const publicClient = createPublicClient({ chain: sepolia, transport: http(RPC_URL) });
const walletClient = createWalletClient({ account, chain: sepolia, transport: http(RPC_URL) });

console.log('=== Sepolia ENS Registration ===');
console.log(`Wallet:        ${account.address}`);
console.log(`Name:          ${NAME}.eth`);
console.log(`Duration:      1 year\n`);

const chainId = await publicClient.getChainId();
if (chainId !== 11155111) fail(`RPC chainId is ${chainId}, expected Sepolia (11155111). Update ENS_RPC_URL.`);

// 1. Availability
console.log('→ Checking availability…');
let isAvailable;
try {
  isAvailable = await publicClient.readContract({
    address: ETH_REGISTRAR_CONTROLLER, abi: CONTROLLER_ABI,
    functionName: 'available', args: [NAME],
  });
} catch (err) {
  fail(`available() failed: ${err.shortMessage ?? err.message}\n  Controller address may be wrong for current Sepolia ENS. Address tried: ${ETH_REGISTRAR_CONTROLLER}`);
}
if (!isAvailable) fail(`${NAME}.eth is already taken on Sepolia. Pick a different name.`);
console.log(`  ✓ ${NAME}.eth is available`);

// 2. Price + balance
console.log('\n→ Checking price + balance…');
const price = await publicClient.readContract({
  address: ETH_REGISTRAR_CONTROLLER, abi: CONTROLLER_ABI,
  functionName: 'rentPrice', args: [NAME, DURATION],
});
const totalPrice = price.base + price.premium;
const balance = await publicClient.getBalance({ address: account.address });
console.log(`  rent (1 yr):   ${formatEther(totalPrice)} ETH`);
console.log(`  wallet balance: ${formatEther(balance)} ETH`);
if (balance < totalPrice * 2n) {
  fail(`Insufficient sETH. Need ~${formatEther(totalPrice * 2n)} (rent + gas headroom), have ${formatEther(balance)}. Get more from a Sepolia faucet.`);
}

// 3. Generate secret + commitment
const secret = generatePrivateKey();
const args = [NAME, account.address, DURATION, secret, PUBLIC_RESOLVER, [], false, 0];

console.log('\n→ Computing commitment…');
const commitment = await publicClient.readContract({
  address: ETH_REGISTRAR_CONTROLLER, abi: CONTROLLER_ABI,
  functionName: 'makeCommitment', args,
});
console.log(`  commitment: ${commitment}`);

// 4. Submit commit
console.log('\n→ Submitting commit tx…');
const commitTx = await walletClient.writeContract({
  address: ETH_REGISTRAR_CONTROLLER, abi: CONTROLLER_ABI,
  functionName: 'commit', args: [commitment],
});
console.log(`  tx: ${commitTx}`);
await publicClient.waitForTransactionReceipt({ hash: commitTx, timeout: 120_000 });
console.log('  ✓ commit mined');

// 5. Wait minCommitmentAge
const minAge = await publicClient.readContract({
  address: ETH_REGISTRAR_CONTROLLER, abi: CONTROLLER_ABI,
  functionName: 'minCommitmentAge',
});
const waitSec = Number(minAge) + 5;
console.log(`\n→ Waiting ${waitSec}s for commitment to age…`);
await new Promise((r) => setTimeout(r, waitSec * 1000));

// 6. Register
console.log('\n→ Submitting register tx…');
const registerTx = await walletClient.writeContract({
  address: ETH_REGISTRAR_CONTROLLER, abi: CONTROLLER_ABI,
  functionName: 'register', args, value: totalPrice,
});
console.log(`  tx: ${registerTx}`);
await publicClient.waitForTransactionReceipt({ hash: registerTx, timeout: 120_000 });
console.log('  ✓ register mined');

console.log(`\n🎉 Registered ${NAME}.eth on Sepolia.`);
console.log(`\nNext: update backend/.env →`);
console.log(`  ENS_NAMESPACE=${NAME}.eth`);
console.log(`\nThen verify with: node scripts/check-ens-namespace.js`);
