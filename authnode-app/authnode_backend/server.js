import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";

import certificateRoutes from "./routes/certificateRoutes.js";
import verifyRoutes from "./routes/verifyRoutes.js";

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/certificates", certificateRoutes);
app.use("/api/verify", verifyRoutes);

app.get("/", (req, res) => {
  res.send("AuthNode Backend Running 🚀");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);
