/**
 * Verifies all deployed contracts on Sourcify using APIv2.
 * Reads stdJsonInput from Hardhat build-info artifacts.
 * Usage: node scripts/verify-sourcify.js
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SOURCIFY_V2 = "https://sourcify.dev/server/v2";
const CHAIN_ID = 11155111;

const DEPLOYED = {
  SafeVault:            { address: "0x281E62bD59ee077c1974e1523B2d91d860246a96", txHash: "0x..." },
  ReentrantVault:       { address: "0xf1b4913098a844533167Cee439EAd20F213d1da5", txHash: "0x..." },
  BrokenAccessControl: { address: "0x60957fE6744ACc9c2C937922b2df90d9Ae7df58D", txHash: "0x..." },
};

function getBuildInfo() {
  const dir = path.join(__dirname, "../artifacts/build-info");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
  if (!files.length) throw new Error("No build-info found — run npm run compile first");
  return JSON.parse(fs.readFileSync(path.join(dir, files[0]), "utf8"));
}

async function submitAndWait(contractName, address, txHash, buildInfo) {
  const contractPath = `contracts/${contractName}.sol`;

  const payload = {
    stdJsonInput: {
      language: buildInfo.input.language,
      sources: buildInfo.input.sources,
      settings: buildInfo.input.settings,
    },
    compilerVersion: buildInfo.solcLongVersion,
    contractIdentifier: `${contractPath}:${contractName}`,
    creationTransactionHash: txHash !== "0x..." ? txHash : undefined,
  };

  // Submit
  const submitRes = await fetch(`${SOURCIFY_V2}/verify/${CHAIN_ID}/${address}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const submitData = await submitRes.json();

  if (submitRes.status === 409) {
    console.log(`✓ ${contractName}: already verified`);
    return;
  }
  if (!submitRes.ok) {
    console.warn(`✗ ${contractName}: ${submitData.message ?? submitRes.statusText}`);
    return;
  }

  const { verificationId } = submitData;
  console.log(`  ${contractName}: submitted (id: ${verificationId})`);

  // Poll until done
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 2000));
    const pollRes = await fetch(`${SOURCIFY_V2}/verify/${verificationId}`);
    const poll = await pollRes.json();

    if (poll.isJobCompleted) {
      console.log(`✓ ${contractName} (${address}): ${poll.contract?.match ?? "verified"}`);
      return;
    }
    if (poll.errorMessage) {
      console.warn(`✗ ${contractName}: ${poll.errorMessage}`);
      return;
    }
  }

  console.warn(`? ${contractName}: timed out — check https://repo.sourcify.dev/${CHAIN_ID}/${address}`);
}

async function main() {
  const buildInfo = getBuildInfo();
  console.log(`Compiler: ${buildInfo.solcLongVersion}`);
  console.log(`Submitting to Sourcify (chain ${CHAIN_ID})...\n`);

  for (const [name, { address, txHash }] of Object.entries(DEPLOYED)) {
    await submitAndWait(name, address, txHash, buildInfo);
  }
}

main().catch(console.error);
