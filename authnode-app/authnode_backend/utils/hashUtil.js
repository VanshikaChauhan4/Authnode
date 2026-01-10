import mongoose from "mongoose";

const certificateSchema = new mongoose.Schema(
  {
    studentName: String,
    course: String,
    institution: String,
    issueDate: String,
    hash: String,
    qrCode: String
  },
  { timestamps: true }
);

export default mongoose.model("Certificate", certificateSchema);
