// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title AuthNode certificate hash registry
/// @notice Stores hashes and lifecycle metadata only; never store student PII or PDFs.
contract AuthNode {
    struct Certificate {
        bytes32 documentHash;
        address issuer;
        uint64 issuedAt;
        uint64 revokedAt;
        bool exists;
        bool revoked;
    }

    address public owner;
    mapping(address => bool) private authorizedIssuers;
    mapping(bytes32 => Certificate) private certificates;

    event IssuerAuthorizationChanged(address indexed issuer, bool authorized);
    event CertificateIssued(bytes32 indexed certificateKey, string certificateId, bytes32 documentHash, address indexed issuer, uint64 issuedAt);
    event CertificateRevoked(bytes32 indexed certificateKey, string certificateId, address indexed issuer, uint64 revokedAt);

    error Unauthorized();
    error InvalidInput();
    error AlreadyRegistered();
    error NotFound();
    error AlreadyRevoked();

    modifier onlyOwner() { if (msg.sender != owner) revert Unauthorized(); _; }
    modifier onlyIssuer() { if (!authorizedIssuers[msg.sender]) revert Unauthorized(); _; }

    constructor() { owner = msg.sender; }

    function setIssuerAuthorization(address issuer, bool authorized) external onlyOwner {
        if (issuer == address(0)) revert InvalidInput();
        authorizedIssuers[issuer] = authorized;
        emit IssuerAuthorizationChanged(issuer, authorized);
    }

    function isAuthorizedIssuer(address issuer) external view returns (bool) {
        return authorizedIssuers[issuer];
    }

    function issueCertificate(string calldata certificateId, bytes32 documentHash) external onlyIssuer {
        if (bytes(certificateId).length == 0 || documentHash == bytes32(0)) revert InvalidInput();
        bytes32 key = keccak256(bytes(certificateId));
        if (certificates[key].exists) revert AlreadyRegistered();
        uint64 timestamp = uint64(block.timestamp);
        certificates[key] = Certificate(documentHash, msg.sender, timestamp, 0, true, false);
        emit CertificateIssued(key, certificateId, documentHash, msg.sender, timestamp);
    }

    function verifyCertificate(string calldata certificateId, bytes32 submittedHash)
        external view returns (bool exists, bool hashMatches, bool revoked, address issuer, uint64 issuedAt, uint64 revokedAt)
    {
        Certificate memory cert = certificates[keccak256(bytes(certificateId))];
        return (cert.exists, cert.exists && cert.documentHash == submittedHash, cert.revoked, cert.issuer, cert.issuedAt, cert.revokedAt);
    }

    function getCertificate(string calldata certificateId)
        external view returns (bytes32 documentHash, address issuer, uint64 issuedAt, uint64 revokedAt, bool exists, bool revoked)
    {
        Certificate memory cert = certificates[keccak256(bytes(certificateId))];
        return (cert.documentHash, cert.issuer, cert.issuedAt, cert.revokedAt, cert.exists, cert.revoked);
    }

    function revokeCertificate(string calldata certificateId) external {
        bytes32 key = keccak256(bytes(certificateId));
        Certificate storage cert = certificates[key];
        if (!cert.exists) revert NotFound();
        if (cert.issuer != msg.sender || !authorizedIssuers[msg.sender]) revert Unauthorized();
        if (cert.revoked) revert AlreadyRevoked();
        cert.revoked = true;
        cert.revokedAt = uint64(block.timestamp);
        emit CertificateRevoked(key, certificateId, msg.sender, cert.revokedAt);
    }
}
