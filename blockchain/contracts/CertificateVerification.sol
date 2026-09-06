pragma solidity ^0.8.24;

contract CertificateVerification {

    address public owner;

    mapping(string => bool) private certificateHashes;
    mapping(string => bool) private revokedHashes;

    event CertificateStored(string hash);
    event CertificateRevoked(string hash);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized: only the issuing institution can perform this action");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function storeCertificate(string memory hash) public onlyOwner {
        certificateHashes[hash] = true;
        emit CertificateStored(hash);
    }

    function revokeCertificate(string memory hash) public onlyOwner {
        require(certificateHashes[hash], "Certificate does not exist");
        revokedHashes[hash] = true;
        emit CertificateRevoked(hash);
    }

    function verifyCertificate(string memory hash) public view returns (bool) {
        return certificateHashes[hash] && !revokedHashes[hash];
    }

    function isRevoked(string memory hash) public view returns (bool) {
        return revokedHashes[hash];
    }
}