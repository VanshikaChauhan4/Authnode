const { expect } = require('chai');
const { ethers } = require('hardhat');
describe('AuthNode', function () {
  async function setup() {
    const [owner, issuer, other] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory('AuthNode');
    const contract = await Factory.deploy();
    await contract.waitForDeployment();
    await contract.setIssuerAuthorization(issuer.address, true);
    return { contract, owner, issuer, other };
  }
  it('allows an authorized issuer to register and verify a certificate hash', async function () {
    const { contract, issuer } = await setup();
    const hash = ethers.keccak256(ethers.toUtf8Bytes('certificate payload'));
    await expect(contract.connect(issuer).issueCertificate('CERT-101', hash)).to.emit(contract, 'CertificateIssued');
    const result = await contract.verifyCertificate('CERT-101', hash);
    expect(result.exists).to.equal(true);
    expect(result.hashMatches).to.equal(true);
    expect(result.revoked).to.equal(false);
    expect(result.issuer).to.equal(issuer.address);
  });
  it('rejects unauthorized issuers and duplicate IDs', async function () {
    const { contract, issuer, other } = await setup();
    const hash = ethers.keccak256(ethers.toUtf8Bytes('x'));
    await expect(contract.connect(other).issueCertificate('CERT-1', hash)).to.be.revertedWithCustomError(contract, 'Unauthorized');
    await contract.connect(issuer).issueCertificate('CERT-1', hash);
    await expect(contract.connect(issuer).issueCertificate('CERT-1', hash)).to.be.revertedWithCustomError(contract, 'AlreadyRegistered');
  });
  it('allows only the issuing institution to revoke and prevents repeat revocation', async function () {
    const { contract, issuer, other } = await setup();
    const hash = ethers.keccak256(ethers.toUtf8Bytes('x'));
    await contract.connect(issuer).issueCertificate('CERT-2', hash);
    await expect(contract.connect(other).revokeCertificate('CERT-2')).to.be.revertedWithCustomError(contract, 'Unauthorized');
    await expect(contract.connect(issuer).revokeCertificate('CERT-2')).to.emit(contract, 'CertificateRevoked');
    const result = await contract.verifyCertificate('CERT-2', hash);
    expect(result.revoked).to.equal(true);
    await expect(contract.connect(issuer).revokeCertificate('CERT-2')).to.be.revertedWithCustomError(contract, 'AlreadyRevoked');
  });
  it('returns not found for unknown IDs', async function () {
    const { contract } = await setup();
    const result = await contract.getCertificate('MISSING');
    expect(result.exists).to.equal(false);
  });
});
