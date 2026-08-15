const express = require("express");
const crypto = require("crypto");
const multer = require("multer");
const fs = require("fs");

const app = express();
const PORT = 5000;

// Middleware
app.use(express.json());

// File upload configuration
const upload = multer({
    dest: "uploads/"
});

// Test route
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Blockchain Certificate Verification Backend is running!"
    });
});

// Certificate upload route
app.post("/upload", upload.single("certificate"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: "No certificate file uploaded"
        });
    }
    const fileData = fs.readFileSync(req.file.path);
    const hash = crypto.createHash("sha256").update(fileData).digest("hex");
    fs.writeFileSync("certificate-hash.txt", hash);
    res.json({
        success: true,
        message: "Certificate uploaded successfully",
        filename: req.file.originalname,
        storedFile: req.file.filename,
        hash: hash
    });
});
// Certificate verification route
app.post("/verify", upload.single("certificate"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: "No certificate file uploaded"
        });
    }

    const fileData = fs.readFileSync(req.file.path);

    const hash = crypto
        .createHash("sha256")
        .update(fileData)
        .digest("hex");

    const originalHash = fs.readFileSync(
        "certificate-hash.txt",
        "utf8"
    ).trim();

    if (hash === originalHash) {
        return res.json({
            success: true,
            verified: true,
            message: "Certificate is genuine",
            filename: req.file.originalname,
            hash: hash
        });
    }

    res.json({
        success: true,
        verified: false,
        message: "Certificate is tampered or not registered",
        filename: req.file.originalname,
        hash: hash
    });
});
// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});