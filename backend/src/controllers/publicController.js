const Token = require('../models/Token');
const User = require('../models/User');
const otpService = require('../services/otpService');
const mongoose = require('mongoose');


// BOOK APPOINTMENT — creates a Token document
exports.bookAppointment = async (req, res) => {
  try {
    const { patientName, phone, address, email, specialization, doctorId, appointmentDate } = req.body;

    if (!patientName || !phone || !address || !specialization || !doctorId || !appointmentDate) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({ success: false, message: 'Invalid doctor id' });
    }

    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== 'doctor') {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    // Generate sequential token number
    const lastToken = await Token.findOne().sort({ tokenNumber: -1 });
    const tokenNumber = lastToken ? lastToken.tokenNumber + 1 : 1;

    const otp = otpService.generateOTP();
    const otpExpiry = otpService.getOTPExpiry();

    console.log('=================================');
    console.log('OTP SENT TO:', phone);
    console.log('OTP:', otp);
    console.log('=================================');

    const token = await Token.create({
      tokenNumber,
      patient: { name: patientName, phone, address, email },
      doctor: doctorId,
      specialization,
      appointmentDate,
      otp,
      otpExpiry,
      otpVerified: false,
      status: 'pending'
    });

    await otpService.sendOTP(phone, otp);

    // Return tokenNumber (consistent key name)
    res.status(201).json({
      success: true,
      data: {
        tokenNumber: token.tokenNumber,
        message: 'OTP sent'
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Booking failed' });
  }
};


// VERIFY OTP — looks up Token by tokenNumber + phone
exports.verifyOTP = async (req, res) => {
  try {
    const { tokenNumber, otp, phone } = req.body;

    // Find token using correct model (Token) and correct field (tokenNumber)
    const token = await Token.findOne({
      tokenNumber: Number(tokenNumber),
      'patient.phone': phone
    }).select('+otp');

    if (!token) {
      return res.status(404).json({ success: false, message: 'Token not found' });
    }

    // Check OTP
    if (token.otp !== String(otp)) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    // Check expiry
    if (token.otpExpiry && new Date() > token.otpExpiry) {
      return res.status(400).json({ success: false, message: 'OTP has expired' });
    }

    token.otpVerified = true;
    token.status = 'confirmed';
    await token.save();

    res.json({
      success: true,
      message: 'Appointment confirmed',
      data: { tokenNumber: token.tokenNumber }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'OTP verification failed' });
  }
};


// GET DOCTORS — no rating field returned
exports.getDoctors = async (req, res) => {
  try {
    const { specialization } = req.query;
    const query = { role: 'doctor' };
    if (specialization) query.specialization = specialization;

    const doctors = await User.find(query)
      .select('name specialization experience');

    res.json({ success: true, data: doctors });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch doctors' });
  }
};


// GET APPOINTMENTS BY PHONE — patient lookup, no auth needed
exports.getAppointmentsByPhone = async (req, res) => {
  try {
    const { phone } = req.query;
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone number required' });
    }

    // Normalize: strip spaces, dashes, country codes
    const digits = phone.replace(/[\s\-\(\)]/g, '').replace(/^(\+91|0091|91|0)/, '');

    // Match any stored format containing these digits
    const tokens = await Token.find({
      'patient.phone': { $regex: digits, $options: 'i' }
    })
      .populate('doctor', 'name specialization experience profileImage')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: tokens.length, data: tokens });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch appointments' });
  }
};
