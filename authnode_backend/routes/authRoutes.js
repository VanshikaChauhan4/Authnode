import express from "express";
import { login, me } from "../controllers/authController.js";
import auth from "../middleware/authMiddleware.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";


const router = express.Router();

router.post("/login", login);
router.get("/me", auth, me);

export default router;
