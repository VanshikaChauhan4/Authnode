import express from "express";
import { verifyCertificate } from "../controllers/verifyController.js";

const router = express.Router();

router.get("/:hash", verifyCertificate);

export default router;
