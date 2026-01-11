import Certificate from "../models/Certificate.js";

export const issueCertificate = async (req, res) => {
  const cert = await Certificate.create({
    ...req.body,
    issuedBy: req.user._id,
    txHash: "AUTHNODE-" + Date.now()
  });

  res.json(cert);
};

export const myCertificates = async (req, res) => {
  const certs = await Certificate.find({
    issuedBy: req.user._id
  });

  res.json(certs);
};
