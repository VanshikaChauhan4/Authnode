// Small JSON CLI bridge used by the existing FastAPI service. No secrets are sent to the browser.
const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function main() {
  const [command, ...args] = process.argv.slice(2);
  const network = process.env.BLOCKCHAIN_NETWORK || 'sepolia';
  const rpc = network === 'localhost'
    ? (process.env.LOCAL_RPC_URL || 'http://127.0.0.1:8545')
    : process.env.ALCHEMY_RPC_URL;
  const address = process.env.CONTRACT_ADDRESS;
  if (!rpc || !address) throw new Error('Blockchain is not configured: set the RPC URL and CONTRACT_ADDRESS in blockchain/.env');
  const artifactPath = path.resolve(__dirname, '../artifacts/contracts/AuthNode.sol/AuthNode.json');
  if (!fs.existsSync(artifactPath)) throw new Error('Contract artifact missing. Run npm run compile in blockchain/.');
  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  const provider = new ethers.JsonRpcProvider(rpc, Number(process.env.CHAIN_ID || 11155111));
  const wallet = process.env.PRIVATE_KEY ? new ethers.Wallet(process.env.PRIVATE_KEY, provider) : null;
  const read = new ethers.Contract(address, artifact.abi, provider);
  let result;
  if (command === 'issue') {
    if (!wallet) throw new Error('PRIVATE_KEY is required for blockchain writes.');
    const [certificateId, hash] = args;
    const contract = read.connect(wallet);
    const tx = await contract.issueCertificate(certificateId, `0x${hash}`);
    const receipt = await tx.wait();
    const block = await provider.getBlock(receipt.blockNumber);
    result = { transactionHash: receipt.hash, issuerAddress: wallet.address, blockNumber: receipt.blockNumber, blockTimestamp: block ? new Date(Number(block.timestamp) * 1000).toISOString() : null, network };
  } else if (command === 'verify') {
    const [certificateId, hash] = args;
    const r = await read.verifyCertificate(certificateId, `0x${hash}`);
    result = { exists: r.exists, hashMatches: r.hashMatches, revoked: r.revoked, issuerAddress: r.issuer, issuedAt: Number(r.issuedAt), revokedAt: Number(r.revokedAt), network };
  } else if (command === 'get') {
    const [certificateId] = args;
    const r = await read.getCertificate(certificateId);
    result = { hash: r.documentHash, issuerAddress: r.issuer, issuedAt: Number(r.issuedAt), revokedAt: Number(r.revokedAt), exists: r.exists, revoked: r.revoked, network };
  } else if (command === 'revoke') {
    if (!wallet) throw new Error('PRIVATE_KEY is required for blockchain writes.');
    const [certificateId] = args;
    const tx = await read.connect(wallet).revokeCertificate(certificateId);
    const receipt = await tx.wait();
    const block = await provider.getBlock(receipt.blockNumber);
    result = { transactionHash: receipt.hash, issuerAddress: wallet.address, blockNumber: receipt.blockNumber, blockTimestamp: block ? new Date(Number(block.timestamp) * 1000).toISOString() : null, network };
  } else {
    throw new Error('Unsupported bridge command.');
  }
  process.stdout.write(JSON.stringify(result));
}
main().catch((error) => { process.stderr.write((error.shortMessage || error.message || 'Blockchain operation failed') + '\n'); process.exit(1); });
