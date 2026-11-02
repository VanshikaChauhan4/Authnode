const hre = require('hardhat');
async function main() {
  const address = process.env.ISSUER_ADDRESS;
  const contractAddress = process.env.CONTRACT_ADDRESS;
  if (!address || !contractAddress) throw new Error('Set ISSUER_ADDRESS and CONTRACT_ADDRESS in blockchain/.env');
  const artifact = await hre.artifacts.readArtifact('AuthNode');
  const contract = new hre.ethers.Contract(contractAddress, artifact.abi, (await hre.ethers.getSigners())[0]);
  const tx = await contract.setIssuerAuthorization(address, true);
  const receipt = await tx.wait();
  console.log(JSON.stringify({ issuer: address, txHash: receipt.hash, network: hre.network.name }, null, 2));
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
