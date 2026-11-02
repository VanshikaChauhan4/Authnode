# Security and trust — how AuthNode works

## SHA-256 canonical certificate fingerprint

AuthNode builds a fixed-order canonical string from the certificate's student name, lowercase student email, course, certificate title, institution ID, institution name, and issue date. Values are trimmed, UTF-8 encoded, and hashed with SHA-256. New issuance rejects the `|` delimiter inside fields because the current compatible canonical format uses it as a field separator.

SHA-256 is an integrity fingerprint, not encryption. A change to any canonical field changes the digest.

## RSA digital signature

When an institution account is created, AuthNode generates an RSA key pair. The institution's private key signs the SHA-256 fingerprint using RSA-PSS with SHA-256. Verification checks the signature using the institution's public key. Newly generated private keys are encrypted at rest with Fernet; production must provide a secure `AUTHNODE_KEY_ENCRYPTION_KEY`. Legacy database rows created before this change may still contain plaintext private keys and should be migrated/rotated.

## Optional Ethereum blockchain anchoring

AuthNode now includes a Solidity `AuthNode.sol` contract and an ethers.js integration. When the operator deploys the contract and sets `BLOCKCHAIN_ENABLED=true`, certificate issuance submits the SHA-256 fingerprint, certificate ID, and issuer wallet address to the configured EVM network (Sepolia by default). The contract supports issuer authorization, duplicate prevention, verification, and issuer-only revocation. The backend stores the returned transaction hash and network in SQLite.

When blockchain configuration is absent or disabled, AuthNode performs local SQLite + SHA-256 + RSA verification only. It must not claim a certificate is on-chain verified. If the configured RPC or contract is unavailable, verification fails closed and reports that verification could not be completed.

Only certificate ID, hash, issuer wallet, timestamps and lifecycle status are stored on chain. Full PDFs and student personal data are not placed on the public ledger. The current API bridge uses one configured transaction signer; a production multi-institution deployment needs per-institution wallet binding and key custody.

## PDF hashing trade-off

The uploaded PDF receives a separate raw-file SHA-256 audit digest. It is not compared with the canonical certificate-data digest because re-exporting, metadata edits, or scanning change PDF bytes. The certificate ID is used to retrieve and verify the canonical record. This avoids false negatives from harmless PDF re-exports, but does not prove the uploaded PDF's visual appearance is identical to the issued artifact. A future signed embedded payload/QR reference can bind the displayed PDF to its signed data.

## Is IPFS involved?

No. AuthNode does not currently store certificate PDFs on IPFS.

## Is AuthNode 100% fraud-proof?

No system can honestly claim that. AuthNode is designed to make unauthorized modification of canonical certificate details detectable. Verification results come from cryptographic checks and the configured backend/chain—not an AI prediction.
