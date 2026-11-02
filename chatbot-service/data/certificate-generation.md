# How AuthNode generates a certificate

Only accounts signed in with the **Institution** role can issue certificates.

## Step by step

1. **Sign in as an Institution.** AuthNode creates an RSA key pair for the account. Newly generated private keys are encrypted at rest by the backend.
2. **Go to the Issue page.** Enter the student's name, email, course or credential title, and issue date.
3. **Submit.** AuthNode trims the text fields and builds a fixed-order canonical string from student name, lowercase email, course, certificate title, institution ID, institution name, and issue date. The backend hashes the UTF-8 bytes with SHA-256 and signs the digest using the institution's RSA-PSS private key.
4. **Save the record.** SQLite stores the certificate fields, fingerprint, signature, status, and a short Certificate ID (the first 12 characters of the fingerprint).
5. **Optional blockchain registration.** If the operator has deployed the AuthNode contract and enabled `BLOCKCHAIN_ENABLED=true`, ethers.js submits the Certificate ID and fingerprint to the configured network. The transaction hash, network and timestamp are saved. If blockchain is disabled, the record is labelled `LOCAL_CRYPTOGRAPHIC`; it is not represented as on-chain.
6. **QR code.** The frontend generates a QR code linking to the verification route for the Certificate ID.

## What determines the fingerprint

The canonical fields and order are: student name, student email, course, certificate title, institution ID, institution name, and issue date. The student email is lowercased; fields are trimmed. The current compatible format uses `|` as a delimiter, so new issuance rejects a pipe character in a field. Changing a canonical field changes the SHA-256 digest.

## Duplicate issuance

AuthNode rejects an exact duplicate certificate ID/hash locally. The smart contract independently rejects duplicate certificate IDs when blockchain registration is enabled.
