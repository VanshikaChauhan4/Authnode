# AuthNode — Blockchain certificate verification + RAG assistant

This is an upgrade of the supplied AuthNode application. The original React/Vite frontend, FastAPI certificate API, SQLite database, RSA signing flow, and separate LangChain chatbot are retained. Blockchain is **opt-in**: when the operator has not configured a chain, the API continues to perform local SHA-256/RSA verification and explicitly reports that no on-chain registration is confirmed.

## Architecture

| Layer | Existing / upgraded technology | Default port |
|---|---|---:|
| Frontend | React 18, Vite, React Router | 5173 |
| Certificate API | FastAPI, SQLite, SHA-256, RSA-2048 / PKCS#1 v1.5 | 5000 |
| Blockchain | Solidity 0.8.24, Hardhat, ethers.js 6, Ethereum Sepolia | RPC |
| AI assistant | FastAPI, LangChain, ChromaDB, BM25, HuggingFace embeddings, Ollama | 8000 |
| LLM | Llama 3.1 8B via Ollama | 11434 |

## What changed

### Blockchain
- Added `blockchain/contracts/AuthNode.sol` with issuer authorization, issue, verify, get, revoke, duplicate prevention and events.
- Added Hardhat config, Sepolia deployment and issuer authorization scripts, and Solidity unit tests.
- Added an ethers.js bridge called by the existing FastAPI service. Private keys and Alchemy credentials remain server-side.
- Existing certificate issue flow now writes a real on-chain transaction only when `BLOCKCHAIN_ENABLED=true` and a valid contract configuration exists. The transaction hash and network are saved in SQLite.
- Verification checks local SHA-256, RSA signature, and (when enabled) the on-chain hash/revocation state. RPC errors fail closed.
- Added status, revocation, and PDF-upload verification endpoints.

### PDF hashing semantics
AuthNode's existing fingerprint is a SHA-256 hash of a canonical string made from the stored certificate fields in a fixed order: student name, lowercase email, course, certificate title, institution ID, institution name, and issue date. String fields are trimmed; the email is lowercased; the UTF-8 bytes are hashed. The legacy `|` delimiter is retained for compatibility and new issuance rejects a `|` inside a field.

The uploaded PDF receives a separate raw-file SHA-256 audit fingerprint. It is **not** compared with the canonical certificate-data fingerprint. Re-exporting a PDF, changing metadata, or scanning/printing it changes its bytes and can change a raw-file hash even when the visible certificate details remain the same. Hashing canonical structured fields avoids that false mismatch, but it does not prove the visual layout or detect a forged PDF that merely displays copied fields. For stronger document-level binding, a future format should embed a signed canonical payload/QR reference in the PDF and verify that payload independently.

### Security
- Newly generated institution RSA private keys are encrypted at rest using Fernet. Development creates a gitignored local key file; production must set `AUTHNODE_KEY_ENCRYPTION_KEY` to a securely managed Fernet key. Existing legacy plaintext keys remain readable for backwards compatibility and should be rotated/migrated operationally.
- No private keys or RPC secrets are sent to the frontend.
- Certificate PDF uploads are limited to 10 MB and checked for PDF MIME type and `%PDF-` header.
- Only an authenticated institution that owns a certificate can request its revocation through the API. The contract independently enforces issuer authorization.
- The RAG tools are read-only. The assistant cannot issue or revoke certificates.

### RAG assistant
- Preserves existing ChromaDB + HuggingFace + Ollama pipeline and 500/80 chunk configuration.
- Adds BM25 keyword retrieval and Reciprocal Rank Fusion with semantic retrieval.
- Adds read-only LangChain tools for certificate verification/status and explanations of blockchain, SHA-256, RSA signatures and certificate security.
- Certificate IDs in chat trigger the live AuthNode backend tool. Verification output is deterministic; an LLM is not allowed to invent a genuine/invalid result. Backend failures are reported as inconclusive.

### Frontend
- Preserves the existing visual design and image-to-image OCR verification flow.
- Adds certificate ID + PDF upload verification to the existing Verify page.
- Shows the PDF audit digest and blockchain registration/transaction details when present.

## OCR image-verification fix

The two-image verifier runs OCR in the browser with Tesseract.js. Its parser now handles common OCR layout variations in certificate emails, including `INTERN` / `NAME` split across separate lines, stray glyphs inserted into labels, and certificate IDs split across lines such as `TBI-2026-PTQU-` followed by `ID FZ45`. The email screenshot uses sparse-text page segmentation; the certificate uses automatic page segmentation.

A successful OCR read only extracts and compares the visible details. The backend still requires a matching authoritative AuthNode SQLite record and valid SHA-256/RSA checks (and blockchain checks when configured). An externally issued certificate that has not been registered in AuthNode will correctly return `not_found`; OCR alone never marks it genuine.

## Local installation

Prerequisites: Python 3.10+, Node.js 20+, npm, and (for AI responses) Ollama.

### 1. Certificate API

PowerShell:

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
python run.py
```

The API is at `http://localhost:5000`; health check: `http://localhost:5000/health`.

For a deployed frontend, set `AUTHNODE_CORS_ORIGINS` in `backend/.env` to the exact comma-separated frontend origins (including `https://`), and set `VITE_API_URL` / `VITE_CHAT_URL` in `frontend/.env` to the deployed API URLs before building. A public frontend must not use `localhost` as its API host.

For production, set `AUTHNODE_KEY_ENCRYPTION_KEY` in the backend environment. Generate a Fernet key with:

```powershell
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

Do not commit the generated key.

### 2. Frontend

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

### 3. Chatbot

Install Ollama, then:

```powershell
ollama pull llama3.1:8b
ollama serve
```

In another terminal:

```powershell
cd chatbot-service
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
python ingest.py
python app.py
```

The chatbot runs at `http://localhost:8000`. `AUTHNODE_API_URL` defaults to `http://localhost:5000/api`. If Ollama is offline, the existing retrieval-only fallback remains available.

## Local blockchain development

You can test a real EVM contract locally without Alchemy or Sepolia credentials:

1. Copy `blockchain/.env.example` to `blockchain/.env` and set `LOCAL_RPC_URL=http://127.0.0.1:8545`, `CHAIN_ID=31337`, and `BLOCKCHAIN_NETWORK=localhost`.
2. Start a local Hardhat node in terminal 1:

```powershell
cd blockchain
npm install
npx hardhat node
```

3. Copy one of the disposable test private keys printed by the local node into `PRIVATE_KEY` in `blockchain/.env`. Set `ISSUER_ADDRESS` to the matching account address. These are local-only test keys; never use them on a public network.
4. In terminal 2, compile and deploy:

```powershell
cd blockchain
npx hardhat compile
npm run deploy:local
```

5. Put the printed contract address in `CONTRACT_ADDRESS`, then authorize the issuer:

```powershell
npm run authorize:local
```
6. Set `BLOCKCHAIN_ENABLED=true` in `blockchain/.env`, restart the API, and issue a test certificate. The API bridge points at the local RPC endpoint based on `LOCAL_RPC_URL`.

## Sepolia deployment

**Do not use a wallet holding real funds.** Use a dedicated test wallet with Sepolia ETH only.

1. Create an Alchemy Sepolia RPC endpoint and copy `blockchain/.env.example` to `blockchain/.env`.
2. Set `ALCHEMY_RPC_URL`, `PRIVATE_KEY`, `CHAIN_ID=11155111`, and `BLOCKCHAIN_NETWORK=sepolia`.
3. Install and compile:

```powershell
cd blockchain
npm install
npx hardhat compile
```

4. Deploy:

```powershell
npm run deploy:sepolia
```

5. Copy the printed contract address into `CONTRACT_ADDRESS` in `blockchain/.env`. Set `ISSUER_ADDRESS` to the wallet address derived from `PRIVATE_KEY` (or to another issuer wallet if its private key is configured for the API bridge).
6. Authorize the issuer:

```powershell
npm run authorize:sepolia
```

7. Set `BLOCKCHAIN_ENABLED=true` in `blockchain/.env`, restart the FastAPI process, and verify `/health` plus a test certificate issuance. The same configured bridge wallet is currently used as the transaction signer for institution issuances; production multi-institution deployments should add per-institution wallet/address binding and key custody.
8. Run the contract tests:

```powershell
npm test
```

The application does not claim Sepolia deployment until these steps have actually been performed. No contract address, transaction hash, or successful deployment is included in this source bundle.

## API additions

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/certificates/issue` | Existing issue API; optionally registers on chain |
| POST | `/api/certificates/verify` | PDF upload + `cert_id` form field; checks the official record |
| GET | `/api/certificates/{cert_id}/status` | Local + chain status, hash and revocation evidence |
| POST | `/api/certificates/{cert_id}/revoke` | Authenticated issuer revocation |
| GET | `/api/certificates/{cert_id}/verify` | Existing verification route, now chain-aware when enabled |

## Tests and validation

From the project root:

```powershell
cd backend
pytest -q
```

Contract tests (after `npm install` in `blockchain/`):

```powershell
cd blockchain
npm test
```

Frontend checks:

```powershell
cd frontend
npm install
npm run build
npm run lint
```

## Known limitations / follow-up work

- Sepolia has not been deployed from this environment: no Alchemy credentials, wallet private key, or test ETH were supplied. The Solidity contract, scripts, bridge, and deployment instructions are included, but live-chain operation must be enabled by the operator.
- The bridge currently uses one configured Ethereum transaction signer for institution issuance. Multi-institution production use needs institution wallet registration/binding, issuer key management, and a deliberate transaction sponsorship model.
- Existing legacy institution RSA private keys may be plaintext in older SQLite databases. New keys are encrypted; legacy keys should be migrated and rotated.
- The PDF upload endpoint verifies the certificate ID against the official canonical record and returns a separate raw PDF digest. It does not OCR arbitrary PDFs to discover IDs or prove that PDF bytes are identical to the issued artifact.
- The chatbot's live verification routing is deterministic and read-only; explanatory questions use tool context plus hybrid RAG. It does not have permission to mutate records.
- Frontend build and Hardhat compilation/tests require dependency installation. Run the validation commands above after `npm install`; they must pass before deployment.
