const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

// ── REGISTER ────────────────────────────────────────────────────────────────
router.post("/register", upload.single("image"), async (req, res) => {
  try {
    const { name, email, password, phone, role, specialization, ngoName, experience } = req.body;

    if (!name || !email || !password || !phone || !role) {
      return res.status(400).json({ success: false, message: "All fields required" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: "Email already exists" });
    }

    const userData = { name, email, password, phone, role };

    if (role === "doctor") {
      if (!specialization) {
        return res.status(400).json({ success: false, message: "Specialization required for doctor" });
      }
      userData.specialization = specialization;
      userData.experience = Number(experience) || 0;
      if (req.file) userData.profileImage = `/uploads/${req.file.filename}`;
    }

    if (role === "ngo") {
      if (!ngoName) {
        return res.status(400).json({ success: false, message: "NGO name required" });
      }
      userData.ngoName = ngoName;
    }

    const user = await User.create(userData);
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage || null
      }
    });

  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ success: false, message: err.message || "Signup failed" });
  }
});

// ── LOGIN ────────────────────────────────────────────────────────────────────
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password required" });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage || null
      }
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, message: "Login failed" });
  }
});

// ── GET ME ───────────────────────────────────────────────────────────────────
router.get("/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, data: user });

  } catch (error) {
    res.status(401).json({ success: false, message: "Invalid token" });
  }
});

module.exports = router;