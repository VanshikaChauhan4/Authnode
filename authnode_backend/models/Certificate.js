import mongoose from "mongoose";

const certSchema = new mongoose.Schema(
  {
    studentName: String,
    studentEmail: String,
    course: String,
    issueDate: Date,
    issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    txHash: String
  },
  { timestamps: true }
);

export default mongoose.model("Certificate", certSchema);
