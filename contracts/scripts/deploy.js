import pkg from "hardhat";
const { ethers, network } = pkg;

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying from:", deployer.address);
  console.log("Network:", network.name);

  const contracts = [
    { name: "SafeVault", args: [] },
    { name: "ReentrantVault", args: [] },
    { name: "BrokenAccessControl", args: [] },
    { name: "UncheckedLowCall", args: [deployer.address] },
  ];

  const deployed = {};

  for (const { name, args } of contracts) {
    const Factory = await ethers.getContractFactory(name);
    const contract = await Factory.deploy(...args);
    await contract.waitForDeployment();
    const addr = await contract.getAddress();
    const tx = contract.deploymentTransaction();
    deployed[name] = { address: addr, txHash: tx?.hash ?? "0x" };
    console.log(`${name}: ${addr}  tx: ${tx?.hash}`);
  }

  console.log("\n--- Deployed ---");
  console.log(JSON.stringify(deployed, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
