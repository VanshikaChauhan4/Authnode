import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const login = async (req, res) => {
  const { role } = req.body;

  // DEMO AUTO LOGIN (hackathon-friendly)
  let user = await User.findOne({ role });

  if (!user) {
    user = await User.create({
      name: role === "student" ? "Student User" : "Institute Admin",
      email: `${role}@authnode.com`,
      password: await bcrypt.hash("123456", 10),
      role
    });
  }

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "7d"
  });

  res.json({ token });
};

export const me = async (req, res) => {
  res.json(req.user);
};
