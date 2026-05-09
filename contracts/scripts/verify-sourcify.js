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
  SafeVault:           { address: "0xb85427a633c18dbb38cb3cc8e1534c21614d784d", txHash: "0x785206102132f4c4753b9b568bb600c1cbea763814b7ad06d769531b2dfc63d8" },
  ReentrantVault:      { address: "0x7b875b2b67c8e8facf764aa8d6f5f28c684d38b7", txHash: "0xef79a610298c97e32b7a06e8ded91c115a4233d8ba8ff8efbc6c463780136b4a" },
  BrokenAccessControl: { address: "0xfd47c5d5314a033e080301f13745cdd9b5b5712f", txHash: "0xf2e01ca3d72a9ccb2d225a4bd4e1a739d739db9c358cd8a81dc4b6a93ae8cd49" },
  UncheckedLowCall:    { address: "0x09fc4553480cae8f5df77cb51bc2989b7b7b5f57", txHash: "0xe4f9e5f22390505b5a0390b93958adcd0eae1565416695389712c1aac379cf83" },
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
