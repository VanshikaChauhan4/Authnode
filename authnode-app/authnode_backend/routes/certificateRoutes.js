import express from "express";
import { issueCertificate } from "../controllers/certificateController.js";

const router = express.Router();

router.post("/issue", issueCertificate);

export default router;
