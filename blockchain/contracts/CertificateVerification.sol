// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract CertificateVerification {

    mapping(string => bool) private certificateHashes;

    function storeCertificate(string memory hash) public {
        certificateHashes[hash] = true;
    }

    function verifyCertificate(string memory hash)
        public
        view
        returns (bool)
    {
        return certificateHashes[hash];
    }
} 