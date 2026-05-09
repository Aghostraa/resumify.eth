import 'dotenv/config';
import { createPublicClient, createWalletClient, http, parseEther } from 'viem';
import { randomBytes } from 'node:crypto';
import { sepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

const RPC = process.env.RPC_URL_SEPOLIA!;
const PK = process.env.ENS_PRIVATE_KEY! as `0x${string}`;
const CONTROLLER = '0xfED6A969Aaa60e4961FcD3EBf1A2E8913Ac65B16' as const;
const WRAPPER = '0x0635513f179D50A207757E05759CbD106d7dFcE8' as const;
const RESOLVER = '0x8FADE66B79cC9f707aB26799354482EB93a5B7dD' as const;

const account = privateKeyToAccount(PK);
const publicClient = createPublicClient({ chain: sepolia, transport: http(RPC) });
const walletClient = createWalletClient({ account, chain: sepolia, transport: http(RPC) });

console.log('wallet:', account.address);

const PRICE_ABI = [{ name: 'rentPrice', type: 'function', stateMutability: 'view', inputs: [{ name: 'name', type: 'string' }, { name: 'duration', type: 'uint256' }], outputs: [{ components: [{ name: 'base', type: 'uint256' }, { name: 'premium', type: 'uint256' }], type: 'tuple' }] }] as const;
const COMMIT_ABI = [{ name: 'makeCommitment', type: 'function', stateMutability: 'pure', inputs: [{ name: 'name', type: 'string' }, { name: 'owner', type: 'address' }, { name: 'duration', type: 'uint256' }, { name: 'secret', type: 'bytes32' }, { name: 'resolver', type: 'address' }, { name: 'data', type: 'bytes[]' }, { name: 'reverseRecord', type: 'bool' }, { name: 'ownerControlledFuses', type: 'uint16' }], outputs: [{ type: 'bytes32' }] }, { name: 'commit', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'commitment', type: 'bytes32' }], outputs: [] }] as const;
const REGISTER_ABI = [{ name: 'register', type: 'function', stateMutability: 'payable', inputs: [{ name: 'name', type: 'string' }, { name: 'owner', type: 'address' }, { name: 'duration', type: 'uint256' }, { name: 'secret', type: 'bytes32' }, { name: 'resolver', type: 'address' }, { name: 'data', type: 'bytes[]' }, { name: 'reverseRecord', type: 'bool' }, { name: 'ownerControlledFuses', type: 'uint16' }], outputs: [] }] as const;

const price = await publicClient.readContract({ address: CONTROLLER, abi: PRICE_ABI, functionName: 'rentPrice', args: ['hallmarked', BigInt(365 * 24 * 3600)] });
console.log('price:', price.base + price.premium, 'wei =', Number(price.base + price.premium) / 1e18, 'ETH');

const secret = `0x${Buffer.from(randomBytes(32)).toString('hex')}` as `0x${string}`;
const commitment = await publicClient.readContract({ address: CONTROLLER, abi: COMMIT_ABI, functionName: 'makeCommitment', args: ['hallmarked', account.address, BigInt(365 * 24 * 3600), secret, RESOLVER, [], false, 0] });
console.log('commitment:', commitment);

const commitTx = await walletClient.writeContract({ address: CONTROLLER, abi: COMMIT_ABI, functionName: 'commit', args: [commitment] });
console.log('commit tx:', commitTx);
await publicClient.waitForTransactionReceipt({ hash: commitTx });
console.log('committed. waiting 65s for min commitment age...');
await new Promise(r => setTimeout(r, 65_000));

const value = price.base + price.premium + parseEther('0.001');
const registerTx = await walletClient.writeContract({ address: CONTROLLER, abi: REGISTER_ABI, functionName: 'register', args: ['hallmarked', account.address, BigInt(365 * 24 * 3600), secret, RESOLVER, [], false, 0], value });
console.log('register tx:', registerTx);
await publicClient.waitForTransactionReceipt({ hash: registerTx });
console.log('hallmarked.eth registered!');
