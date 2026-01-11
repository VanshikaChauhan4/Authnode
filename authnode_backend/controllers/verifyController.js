import Certificate from "../models/Certificate.js";

export const verifyCertificate = async (req, res) => {
  const cert = await Certificate.findOne({
    $or: [{ _id: req.params.id }, { txHash: req.params.id }]
  });

  if (!cert) return res.status(404).json({ message: "Invalid" });

  res.json(cert);
};
