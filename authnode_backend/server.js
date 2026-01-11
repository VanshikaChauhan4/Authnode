import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const app = express();
// ✅ CORS CONFIGURATION
app.use(cors({
  origin: 'https://vanshikachauhan4.github.io/Authnode/', // Replace with your frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(express.json());

// ✅ ROUTE IMPORTS
import authRoutes from "./routes/authRoutes.js";
import certificateRoutes from "./routes/certificateRoutes.js";
import verifyRoutes from "./routes/verifyRoutes.js";

// ✅ ROUTE MOUNTS
app.use("/api/auth", authRoutes);
app.use("/api/certificates", certificateRoutes);
app.use("/api/verify", verifyRoutes);

// TEST ROOT
app.get("/", (req, res) => {
  res.send("AuthNode Backend Running 🚀");
});
// server.js ke login route mein ye daal dein
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    
    // Ye line bina database ke login kar degi
    if (email && password) {
        return res.status(200).json({
            success: true,
            message: "Login Successful (Mock Mode)",
            user: { name: "Vanshika", email: email },
            token: "dummy-jwt-token"
        });
    }
    res.status(400).json({ success: false, message: "Invalid credentials" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});