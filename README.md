# Blockchain Certificate Verification System
A blockchain-based system for secure and privacy-preserving academic certificate verification.
CertiChain — Blockchain-Based Academic Certificate Verification System

CertiChain verifies whether an academic certificate is genuine or tampered with, using SHA-256 hashing combined with Ethereum blockchain storage. A university uploads a certificate; the system stores a tamper-proof hash on-chain and generates a QR code that anyone can scan to instantly verify authenticity.

How It Works
University uploads a certificate PDF via the web portal.
Backend computes the certificate's SHA-256 hash.
Hash is stored on an Ethereum smart contract (immutable, tamper-proof record).
System generates a QR code containing the verification URL + hash.
Recruiter/verifier scans the QR code (or opens the verification link).
Verification page sends the hash to the backend.
Backend checks the hash against the blockchain:
Hash exists → Certificate is Genuine ✅
Hash doesn't exist / doesn't match → Certificate is Invalid / Tampered ❌
Tech Stack
Layer	Technology
Smart Contract	Solidity 0.8.28, Hardhat v3.13.0
Blockchain Tooling	Hardhat Ignition, hardhat-toolbox-viem, ethers.js
Backend	Node.js, Express, Multer (file upload), crypto (SHA-256), qrcode
Frontend	HTML, CSS, JavaScript (vanilla)
Local Network	Hardhat local node (http://127.0.0.1:8545)
Project Structure
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
    ├── upload.html
    └── verify-page.html
Smart Contract
solidity
pragma solidity ^0.8.24;

contract CertificateVerification {
    mapping(string => bool) private certificateHashes;

    function storeCertificate(string memory hash) public {
        certificateHashes[hash] = true;
    }

    function verifyCertificate(string memory hash) public view returns (bool) {
        return certificateHashes[hash];
    }
}
API Endpoints

Upload a certificate

POST http://localhost:5000/upload
Body: form-data, key = "certificate", type = File

Verify a certificate

GET http://localhost:5000/verify?hash=<HASH>

Response:

json
{ "verified": true, "message": "Certificate is genuine" }
Setup & Run Locally

1. Start the blockchain node

bash
cd blockchain
npx hardhat node

2. Deploy the smart contract (in a new terminal)

bash
cd blockchain
npx hardhat ignition deploy ignition/modules/CertificateVerification.ts --network localhost

3. Start the backend (in a new terminal)

bash
cd backend
node server.js
# Server running on port 5000

4. Start the frontend (in a new terminal)

bash
cd frontend
npx serve .
# Local: http://localhost:3000

5. Use the app

Open http://localhost:3000/upload.html to upload a certificate and get its QR code.
Open http://localhost:3000/verify-page.html?hash=<HASH> (or scan the QR) to verify it.
Status

Completed

Smart contract written, compiled, and deployed
Hash storage on blockchain working
Upload API (file → SHA-256 hash → on-chain storage → QR generation)
Verification API (hash lookup against blockchain)
Tampered-certificate detection confirmed working
Frontend upload and verification pages, fully wired to the backend
End-to-end tested: genuine certificate verifies as genuine, tampered certificate verifies as invalid

Not yet implemented

Phone/QR scanning over Wi-Fi (requires LAN IP binding + firewall configuration) — currently tested on localhost only
Notes
CORS is enabled on the backend to allow the frontend (port 3000) to communicate with it (port 5000).
The deployed local contract address will change each time the Hardhat node restarts and the contract is redeployed — update the backend's contract address/artifact reference accordingly.