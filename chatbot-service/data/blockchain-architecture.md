# AuthNode blockchain architecture

AuthNode uses a Solidity smart contract compatible with Ethereum. The default public test network is Sepolia (chain ID 11155111); Hardhat local development uses chain ID 31337.

## Contract responsibilities

- The contract owner authorizes institution issuer wallet addresses.
- An authorized issuer registers a unique Certificate ID and a `bytes32` SHA-256 digest.
- The contract stores the digest, issuer address, issuance timestamp, existence and revocation status.
- Anyone can read certificate registration and compare a submitted digest.
- Only the issuer that registered a certificate can revoke it; the contract emits issuance and revocation events.

## Data privacy

The public chain stores no PDF, student name, email, course, or other student personal information. It stores the Certificate ID, fingerprint, issuer address, timestamps and status only.

## Backend interaction

The FastAPI service calls a server-side Node.js bridge using ethers.js. The bridge reads/writes the contract using an RPC URL and private key loaded from `blockchain/.env`. The browser never receives the private key. When `BLOCKCHAIN_ENABLED=false`, no chain transaction is attempted and the certificate is labelled local cryptographic only.

## Security rule

The AI assistant has read-only verification and explanation tools. It cannot issue or revoke a certificate. A blockchain RPC error must be returned as a verification error, not as a successful result.
