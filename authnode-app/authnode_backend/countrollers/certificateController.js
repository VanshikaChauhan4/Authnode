import Certificate from "../models/Certificate.js";
import { generateHash } from "../utils/hashUtil.js";
import { generateQR } from "../utils/qrUtil.js";

export const issueCertificate = async (req, res) => {
  try {
    const { studentName, course, institution, issueDate } = req.body;

    if (!studentName || !course || !institution) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const hash = generateHash(req.body);
    const qrCode = await generateQR(hash);

    const cert = await Certificate.create({
      studentName,
      course,
      institution,
      issueDate,
      hash,
      qrCode
    });

    res.status(201).json({
      message: "Certificate Issued",
      cert
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
