const { ethers } = require("ethers");
const contractArtifact = require("./artifacts/contracts/CertificateVerification.sol/CertificateVerification.json");

const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const UNAUTHORIZED_PRIVATE_KEY = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";

async function main() {
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
    const unauthorizedWallet = new ethers.Wallet(UNAUTHORIZED_PRIVATE_KEY, provider);

    const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        contractArtifact.abi,
        unauthorizedWallet
    );

    console.log("Attempting to store a certificate using an UNAUTHORIZED account...");
    console.log("Unauthorized address:", unauthorizedWallet.address);

    try {
        const tx = await contract.storeCertificate("fake-hash-from-unauthorized-user");
        await tx.wait();
        console.log("UNEXPECTED: transaction succeeded (access control NOT working)");
    } catch (error) {
        console.log("EXPECTED: transaction was rejected");
        console.log("Reason:", error.reason || error.message);
    }
}

main();
