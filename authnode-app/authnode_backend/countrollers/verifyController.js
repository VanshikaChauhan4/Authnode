import Certificate from "../models/Certificate.js";

export const verifyCertificate = async (req, res) => {
  try {
    const { hash } = req.params;

    const cert = await Certificate.findOne({ hash });

    if (!cert) {
      return res.status(404).json({
        status: "FAILED",
        message: "Certificate not found or tampered"
      });
    }

    res.json({
      status: "VERIFIED",
      certificate: cert
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
