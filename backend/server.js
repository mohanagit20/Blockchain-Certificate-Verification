const express = require("express");
const multer = require("multer");
const fs = require("fs");
const crypto = require("crypto");
const QRcode = require("qrcode");
const { ethers } = require("ethers");

const app = express();
const PORT = 5000;
// Allow frontend to communicate with backend
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "*");
    next();
});

// Make sure uploads folder exists
if (!fs.existsSync("uploads")) {
    fs.mkdirSync("uploads");
}

// Multer configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/");
    },
    filename: function (req, file, cb) {
        const uniqueName =
            Date.now() + "-" + file.originalname;

        cb(null, uniqueName);
    }
});

const upload = multer({ storage: storage });


// =====================================================
// BLOCKCHAIN SETUP
// =====================================================

const provider = new ethers.JsonRpcProvider(
    "http://127.0.0.1:8545"
);

const CONTRACT_ADDRESS =
    "0x5FbDB2315678afecb367f032d93F642f64180aa3";

const contractArtifact = require(
    "../blockchain/artifacts/contracts/CertificateVerification.sol/CertificateVerification.json"
);

// Use Account #0 private key from your CURRENT Hardhat node
const PRIVATE_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

const wallet = new ethers.Wallet(
    PRIVATE_KEY,
    provider
);

const contract = new ethers.Contract(
    CONTRACT_ADDRESS,
    contractArtifact.abi,
    wallet
);


// =====================================================
// UPLOAD CERTIFICATE
// =====================================================

app.post(
    "/upload",
    upload.single("certificate"),
    async (req, res) => {

        try {

            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: "No certificate file uploaded"
                });
            }

            // Read uploaded certificate
            const fileData = fs.readFileSync(
                req.file.path
            );

            // Generate SHA-256 hash
            const hash = crypto
                .createHash("sha256")
                .update(fileData)
                .digest("hex");

            // Keep local hash storage
            fs.writeFileSync(
                "certificate-hash.txt",
                hash
            );

            // Store certificate hash on blockchain
            const tx =
                await contract.storeCertificate(hash);

            // Wait for blockchain confirmation
            await tx.wait();
       // Generate QR code
               const qrcode = await QRcode.toDataURL(
       `http://localhost:3000/verify-page.html?hash=${hash}`
   );

            // Send response
            res.json({
                success: true,
                message:
                    "Certificate uploaded and stored on blockchain",
                filename: req.file.originalname,
                storedFile: req.file.filename,
                hash: hash,
                blockchainTransaction: tx.hash,
                qrCode: qrcode
            });

        } catch (error) {

            console.error(
                "UPLOAD ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Certificate upload failed",
                error: error.message
            });
        }
    }
);


// =====================================================
// VERIFY CERTIFICATE
// =====================================================

app.post(
    "/verify",
    upload.single("certificate"),
    async (req, res) => {

        try {

            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: "No certificate file uploaded"
                });
            }

            const fileData =
                fs.readFileSync(req.file.path);

            // Generate SHA-256 hash
            const hash = crypto
                .createHash("sha256")
                .update(fileData)
                .digest("hex");

            // Check hash directly on blockchain
            const verified =
                await contract.verifyCertificate(hash);

            if (verified) {

                return res.json({
                    success: true,
                    verified: true,
                    message:
                        "Certificate is genuine",
                    filename:
                        req.file.originalname,
                    hash: hash
                });

            }

            return res.json({
                success: true,
                verified: false,
                message:
                    "Certificate is tampered or not registered",
                filename:
                    req.file.originalname,
                hash: hash
            });

        } catch (error) {

            console.error(
                "VERIFY ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Certificate verification failed",
                error: error.message
            });
        }
    }
);


// =====================================================
// QR CODE VERIFICATION
// =====================================================

app.get("/verify", async (req, res) => {

    try {

        const hash = req.query.hash;

        if (!hash) {
            return res.status(400).json({
                success: false,
                message: "Hash is required"
            });
        }

        // Verify hash directly on blockchain
        const verified =
            await contract.verifyCertificate(hash);

        if (verified) {

            return res.json({
                success: true,
                verified: true,
                message:
                    "Certificate is genuine",
                hash: hash
            });

        }

        return res.json({
            success: true,
            verified: false,
            message:
                "Certificate is tampered or invalid",
            hash: hash
        });

    } catch (error) {

        console.error(
            "QR VERIFY ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Blockchain verification failed",
            error: error.message
        });
    }
});


// =====================================================
// START SERVER
// =====================================================

app.listen(PORT, () => {
    console.log(
        `Server running on port ${PORT}`
    );
});