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