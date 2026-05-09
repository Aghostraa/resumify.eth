import hre from "hardhat";

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying from:", deployer.address);

  const contracts = [
    { name: "SafeVault", args: [] },
    { name: "ReentrantVault", args: [] },
    { name: "BrokenAccessControl", args: [] },
    { name: "UncheckedLowCall", args: [deployer.address] },
  ];

  const deployed = {};

  for (const { name, args } of contracts) {
    const Factory = await hre.ethers.getContractFactory(name);
    const contract = await Factory.deploy(...args);
    await contract.waitForDeployment();
    const addr = await contract.getAddress();
    const tx = contract.deploymentTransaction();
    deployed[name] = { address: addr, txHash: tx?.hash ?? "0x" };
    console.log(`${name}: ${addr} (tx: ${tx?.hash})`);
  }

  console.log("\nDeployed contracts:", JSON.stringify(deployed, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
