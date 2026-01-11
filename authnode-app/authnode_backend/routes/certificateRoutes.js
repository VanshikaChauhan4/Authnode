import express from "express";
import auth from "../middleware/authMiddleware.js";
import { issueCertificate, myCertificates } from "../controllers/certificateController.js";

const router = express.Router();

router.post("/issue", auth, issueCertificate);
router.get("/my", auth, myCertificates);

export default router;
