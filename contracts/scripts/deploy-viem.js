import 'dotenv/config';
import { createWalletClient, createPublicClient, http, parseAbi } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const RPC_URL = process.env.RPC_URL_SEPOLIA ?? 'https://eth-sepolia.blockscout.com/api/eth-rpc';
const PK = process.env.DEPLOYER_PRIVATE_KEY;
if (!PK) { console.error('DEPLOYER_PRIVATE_KEY not set'); process.exit(1); }

const account = privateKeyToAccount(PK);
const transport = http(RPC_URL);
const walletClient = createWalletClient({ account, chain: sepolia, transport });
const publicClient = createPublicClient({ chain: sepolia, transport });

function loadArtifact(name) {
  const p = resolve(__dirname, `../artifacts/contracts/${name}.sol/${name}.json`);
  return JSON.parse(readFileSync(p, 'utf8'));
}

async function deploy(name, constructorArgs = []) {
  const artifact = loadArtifact(name);
  const hash = await walletClient.deployContract({
    abi: artifact.abi,
    bytecode: artifact.bytecode,
    args: constructorArgs,
  });
  console.log(`  ${name}: tx ${hash} — waiting…`);
  const receipt = await publicClient.waitForTransactionReceipt({ hash, timeout: 120_000 });
  const address = receipt.contractAddress;
  console.log(`  ${name}: ${address}`);
  return { address, txHash: hash };
}

async function main() {
  console.log(`Deployer: ${account.address}`);
  console.log(`Network:  Sepolia\n`);

  const safevault       = await deploy('SafeVault');
  const reentrant       = await deploy('ReentrantVault');
  const brokenAccess    = await deploy('BrokenAccessControl');
  const uncheckedCall   = await deploy('UncheckedLowCall', [account.address]);

  const deployed = {
    SafeVault:            safevault,
    ReentrantVault:       reentrant,
    BrokenAccessControl:  brokenAccess,
    UncheckedLowCall:     uncheckedCall,
  };

  console.log('\n--- Result ---');
  console.log(JSON.stringify(deployed, null, 2));
  console.log('\nPaste these into verify-sourcify.js as DEPLOYED.');
}

main().catch((err) => { console.error(err); process.exit(1); });
