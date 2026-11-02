# AuthNode roadmap and deployment status

## Included in this source bundle

- React frontend with Institution, Student and Employer flows.
- FastAPI backend with SQLite, SHA-256 fingerprints and RSA-PSS signatures.
- Fernet encryption for newly generated institution private keys at rest.
- Solidity `AuthNode.sol`, Hardhat deployment scripts, ethers.js backend bridge, issuer authorization, on-chain verification and revocation.
- Local Hardhat and Sepolia network configuration.
- Optional PDF upload verification with a separate raw-file SHA-256 audit digest.
- LangChain RAG service with Chroma semantic retrieval, BM25 keyword retrieval, Reciprocal Rank Fusion, query rewriting, intent detection and read-only backend tools.

## Requires operator setup

- Install blockchain dependencies, deploy the contract to local Hardhat or Sepolia, authorize an issuer, and configure the matching RPC, contract address and wallet in `blockchain/.env`.
- Set `BLOCKCHAIN_ENABLED=true` and restart the API to use the configured chain.
- Sepolia deployment is not performed automatically by this source bundle; no live contract address or transaction is claimed here.
- Ollama and the selected Llama model must be installed locally for generated conversational responses. Retrieval-only fallback remains available when Ollama is offline.

## Not included

- IPFS document storage.
- Multi-institution wallet onboarding and per-institution transaction signing. The current bridge uses one configured transaction signer and this must be expanded before production multi-tenant use.
