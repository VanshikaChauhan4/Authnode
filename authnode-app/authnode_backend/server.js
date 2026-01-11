import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const app = express();

// ✅ CORS CONFIGURATION
app.use(cors({
  origin: 'https://yourfrontendurl.com', // Replace with your frontend URL
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

// DB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log(err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
