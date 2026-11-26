const hre = require('hardhat');
async function main() {
  const [deployer] = await hre.ethers.getSigners();
  if (!deployer) throw new Error('Set PRIVATE_KEY in blockchain/.env before deploying.');
  const Factory = await hre.ethers.getContractFactory('AuthNode');
  const contract = await Factory.deploy();
  await contract.waitForDeployment();
  console.log(JSON.stringify({ address: await contract.getAddress(), deployer: deployer.address, network: hre.network.name }, null, 2));
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
