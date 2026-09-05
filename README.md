# Blockchain Certificate Verification System
# CertiChain — Blockchain-Based Academic Certificate Verification System

CertiChain verifies whether an academic certificate is genuine, tampered, or revoked, using SHA-256 hashing combined with Ethereum blockchain storage. A university uploads a certificate through a simple web portal; the system stores a tamper-proof hash on-chain, generates a QR code for instant verification, and allows the issuer to revoke a certificate later if needed — all without ever deleting the original blockchain record.

## Complete Workflow

**Issuance**
1. University opens the **Home page** and clicks "Upload a Certificate."
2. A certificate PDF is uploaded via the **Upload page**.
3. Backend computes the certificate's SHA-256 hash.
4. Hash is stored on an Ethereum smart contract (immutable, tamper-proof record).
5. System generates a QR code containing the verification URL + hash, and displays the blockchain transaction confirmation.

**Verification**
6. Recruiter/verifier scans the QR code, or opens the **Verify page** with the hash, or opens it manually and pastes/enters the hash.
7. Verify page sends the hash to the backend.
8. Backend checks the hash against the blockchain and returns one of three distinct outcomes:
   - **Hash exists, not revoked** → Certificate is Genuine ✅
   - **Hash exists, but revoked** → Certificate is Revoked 🚫
   - **Hash doesn't exist / doesn't match** → Certificate is Invalid / Tampered ❌

**Revocation**
9. If a certificate needs to be invalidated after issuance (e.g. incorrect records, rescinded degree, misconduct discovered later), the issuer opens the **Revoke page**, pastes the certificate's hash, and clicks "Revoke Certificate."
10. This calls the smart contract's revoke function — the original hash record is never deleted, but is flagged as revoked.
11. Any future verification of that hash will now correctly show "Revoked" instead of "Genuine."

## Tech Stack

| Layer | Technology |
|---|---|
| Smart Contract | Solidity 0.8.28, Hardhat v3.13.0 |
| Blockchain Tooling | Hardhat Ignition, hardhat-toolbox-viem, ethers.js |
| Backend | Node.js, Express, Multer (file upload), crypto (SHA-256), qrcode |
| Frontend | HTML, CSS, JavaScript (vanilla) |
| Local Network | Hardhat local node (`http://127.0.0.1:8545`) |

## Project Structure

```
blockchain certificate verification/
├── blockchain/
│   ├── contracts/
│   │   └── CertificateVerification.sol
│   ├── ignition/modules/
│   │   └── CertificateVerification.ts
│   └── hardhat.config.ts
├── backend/
│   ├── server.js
│   └── uploads/
└── frontend/
    ├── index.html          # Homepage — links to Upload / Verify / Revoke
    ├── upload.html         # Upload a certificate, get hash + QR code
    ├── verify-page.html    # Verify a certificate by hash (genuine / revoked / invalid)
    ├── revoke.html         # Revoke a previously issued certificate by hash
    └── serve.json          # Local static-server config (disables clean-URL redirects)
```

## Smart Contract

```solidity
pragma solidity ^0.8.24;

contract CertificateVerification {

    mapping(string => bool) private certificateHashes;
    mapping(string => bool) private revokedHashes;

    event CertificateStored(string hash);
    event CertificateRevoked(string hash);

    function storeCertificate(string memory hash) public {
        certificateHashes[hash] = true;
    }

    function revokeCertificate(string memory hash) public {
        require(certificateHashes[hash], "Certificate does not exist");
        revokedHashes[hash] = true;
    }

    function verifyCertificate(string memory hash) public view returns (bool) {
        return certificateHashes[hash] && !revokedHashes[hash];
    }

    function isRevoked(string memory hash) public view returns (bool) {
        return revokedHashes[hash];
    }
}
```

## API Endpoints

**Upload a certificate**
```
POST http://localhost:5000/upload
Body: form-data, key = "certificate", type = File
```

**Verify a certificate**
```
GET http://localhost:5000/verify?hash=<HASH>
```
Response:
```json
{ "success": true, "verified": true, "revoked": false, "message": "Certificate is genuine", "hash": "..." }
```
If revoked:
```json
{ "success": true, "verified": false, "revoked": true, "message": "Certificate has been revoked", "hash": "..." }
```

**Revoke a certificate**
```
POST http://localhost:5000/revoke
Body (JSON): { "hash": "<HASH>" }
```
Response:
```json
{ "success": true, "message": "Certificate revoked successfully" }
```

## Setup & Run Locally

**1. Start the blockchain node**
```bash
cd blockchain
npx hardhat node
```

**2. Deploy the smart contract** (in a new terminal)
```bash
cd blockchain
npx hardhat ignition deploy ignition/modules/CertificateVerification.ts --network localhost
```

**3. Start the backend** (in a new terminal)
```bash
cd backend
node server.js
# Server running on port 5000
```

**4. Start the frontend** (in a new terminal)
```bash
cd frontend
npx serve .
# Local: http://localhost:3000
```

**5. Use the app**
- Open `http://localhost:3000` — this loads the homepage with three options:
  - **📤 Upload a Certificate** → `upload.html` — upload a PDF, get its SHA-256 hash, blockchain transaction, and QR code
  - **🔍 Verify a Certificate** → `verify-page.html` — reads a hash from the URL (or scanned QR) and shows Genuine / Revoked / Invalid
  - **🚫 Revoke a Certificate** → `revoke.html` — paste a hash and revoke it directly from the browser, no terminal commands needed

## Status

**Completed**
- Smart contract written, compiled, and deployed
- Hash storage on blockchain working
- Upload API (file → SHA-256 hash → on-chain storage → QR generation)
- Verification API (hash lookup against blockchain)
- Tampered-certificate detection confirmed working
- **Certificate revocation** — issuer can revoke a previously genuine certificate on-chain; verification distinguishes genuine, revoked, and invalid/tampered as three separate states (most basic hash+blockchain implementations only support two: valid/invalid, with no way to invalidate a certificate after issuance)
- **Homepage (`index.html`)** — single entry point linking to Upload, Verify, and Revoke, styled consistently with the rest of the app
- **Revoke UI (`revoke.html`)** — browser-based form to revoke a certificate by pasting its hash, calling the backend directly with no terminal/PowerShell commands needed
- Frontend upload, verification, and revoke pages, fully wired to the backend, each with clear success/error states
- End-to-end tested: genuine, tampered, and revoked certificates all verify with the correct distinct status, entirely through the UI

**Not yet implemented**
- Phone/QR scanning over Wi-Fi (requires LAN IP binding + firewall configuration) — currently tested on localhost only

## Notes

- CORS is enabled on the backend to allow the frontend (port 3000) to communicate with it (port 5000).
- The deployed local contract address will change each time the Hardhat node restarts and the contract is redeployed — update the backend's contract address/artifact reference accordingly.
- `serve.json` in the frontend folder disables clean-URL redirects (which otherwise strip `.html` and break the `?hash=` query string) and explicitly routes `/` to `index.html`.

## Environment Versions (for future reproducibility)

Run these commands and record the output here whenever revisiting this project after a long gap, so dependency mismatches are easy to diagnose:
```bash
node -v
npm -v
npx hardhat --version
```
At the time this project was last working end-to-end: Node v24.15.0, Hardhat v3.13.0.

## Future Improvement Ideas

- Migrate from local Hardhat node to a public testnet (e.g. Sepolia) for a persistent, publicly accessible deployment
- Selective field disclosure using a Merkle tree (prove one certificate field, e.g. degree or grade, without revealing the whole document)
- Multi-signer issuance (require multiple authorized signers before a certificate hash is accepted on-chain)
- OCR-based automatic field extraction from uploaded certificates
- Proper LAN/mobile QR scanning support with firewall configuration
- Deploy frontend/backend to permanent hosting (Netlify/Vercel + Render/Railway) instead of local-only