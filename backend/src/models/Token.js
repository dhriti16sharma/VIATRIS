const mongoose = require("mongoose");

const tokenSchema = new mongoose.Schema({
  tokenNumber: { type: Number, required: true, unique: true },
  patient: {
    name: String, phone: String, address: String, email: String
  },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  specialization: String,
  appointmentDate: String,
  otp: { type: String, select: false },
  otpExpiry: Date,
  otpVerified: { type: Boolean, default: false },
  status: { type: String, default: "pending" },
  notes: String,
  meetLink: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model("Token", tokenSchema);
