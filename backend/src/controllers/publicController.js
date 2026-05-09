const Token = require('../models/Token');
const User = require('../models/User');
const otpService = require('../services/otpService');
const mongoose = require('mongoose');
const PublicHelpRequest = require('../models/PublicHelpRequest');


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

    await otpService.sendOTP(phone, otp, email);

    // Return tokenNumber (consistent key name)
    const responseData = {
      tokenNumber: token.tokenNumber,
      message: 'OTP sent'
    };
    // Expose OTP only in development so evaluators can see it without opening the terminal
    if (process.env.NODE_ENV === 'development') {
      responseData.otp = otp;
    }
    res.status(201).json({ success: true, data: responseData });

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


// RESEND OTP — generates a new OTP for an existing booking token
exports.resendOTP = async (req, res) => {
  try {
    const { tokenNumber, phone } = req.body;
    if (!tokenNumber || !phone) {
      return res.status(400).json({ success: false, message: 'tokenNumber and phone are required' });
    }

    const digits = phone.replace(/\D/g, '').replace(/^(0091|91)/, '');
    const token = await Token.findOne({
      tokenNumber: Number(tokenNumber),
      'patient.phone': { $regex: digits, $options: 'i' }
    });

    if (!token) {
      return res.status(404).json({ success: false, message: 'Token not found' });
    }
    if (token.status === 'confirmed') {
      return res.status(400).json({ success: false, message: 'Appointment already confirmed' });
    }

    const otp = otpService.generateOTP();
    token.otp = otp;
    token.otpExpiry = otpService.getOTPExpiry();
    await token.save();

    await otpService.sendOTP(token.patient.phone, otp, token.patient.email);

    const responseData = { success: true, message: 'OTP resent successfully' };
    if (process.env.NODE_ENV === 'development') responseData.otp = otp;
    res.json(responseData);
  } catch (error) {
    console.error('resendOTP error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to resend OTP' });
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


// SEND PORTAL OTP — patient authenticates to portal by phone
exports.sendPortalOTP = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ success: false, message: 'Phone number required' });

    const digits = phone.replace(/\D/g, '').replace(/^(0091|91)/, '');

    const existingToken = await Token.findOne({ 'patient.phone': { $regex: digits, $options: 'i' } });
    if (!existingToken) {
      return res.status(404).json({
        success: false,
        message: 'No appointments found for this phone number. Please check the number or book an appointment first.'
      });
    }

    const otp = otpService.generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    await Token.updateMany(
      { 'patient.phone': { $regex: digits, $options: 'i' } },
      { $set: { portalOtp: otp, portalOtpExpiry: otpExpiry } }
    );

    await otpService.sendOTP(phone, otp);

    const response = { success: true, message: 'OTP sent to your phone' };
    if (process.env.NODE_ENV === 'development') response.otp = otp;
    res.json(response);
  } catch (error) {
    console.error('sendPortalOTP error:', error);
    res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
};

// VERIFY PORTAL OTP — confirm phone ownership for portal session
exports.verifyPortalOTP = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) return res.status(400).json({ success: false, message: 'Phone and OTP required' });

    const digits = phone.replace(/\D/g, '').replace(/^(0091|91)/, '');

    const token = await Token.findOne({
      'patient.phone': { $regex: digits, $options: 'i' },
      portalOtpExpiry: { $gt: new Date() }
    }).select('+portalOtp');

    if (!token) return res.status(400).json({ success: false, message: 'OTP expired. Please request a new one.' });
    if (token.portalOtp !== String(otp)) return res.status(400).json({ success: false, message: 'Invalid OTP. Please try again.' });

    await Token.updateMany(
      { 'patient.phone': { $regex: digits, $options: 'i' } },
      { $unset: { portalOtp: '', portalOtpExpiry: '' } }
    );

    res.json({ success: true, message: 'Phone verified successfully' });
  } catch (error) {
    console.error('verifyPortalOTP error:', error);
    res.status(500).json({ success: false, message: 'Verification failed' });
  }
};

// CANCEL APPOINTMENT — patient cancels their own appointment
exports.cancelAppointment = async (req, res) => {
  try {
    const { tokenId, phone } = req.body;
    if (!tokenId || !phone) return res.status(400).json({ success: false, message: 'tokenId and phone required' });

    const digits = phone.replace(/[\s\-\(\)]/g, '').replace(/^(\+91|0091|91|0)/, '');
    const token = await Token.findById(tokenId);
    if (!token) return res.status(404).json({ success: false, message: 'Appointment not found' });

    const storedDigits = token.patient.phone.replace(/[\s\-\(\)]/g, '').replace(/^(\+91|0091|91|0)/, '');
    if (!storedDigits.includes(digits) && !digits.includes(storedDigits)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (token.status === 'completed' || token.status === 'cancelled') {
      return res.status(400).json({ success: false, message: `Appointment is already ${token.status}` });
    }

    token.status = 'cancelled';
    await token.save();
    res.json({ success: true, message: 'Appointment cancelled successfully' });
  } catch (error) {
    console.error('cancelAppointment error:', error);
    res.status(500).json({ success: false, message: 'Failed to cancel appointment' });
  }
};

// GET APPOINTMENTS BY PHONE — patient lookup, no auth needed
exports.getAppointmentsByPhone = async (req, res) => {
  try {
    const { phone } = req.query;
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone number required' });
    }

    // Normalize: strip all non-digit chars to avoid invalid regex from + or ( in input
    const digits = phone.replace(/\D/g, '').replace(/^(0091|91)/, '');

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

// SUBMIT PUBLIC HELP REQUEST — no auth required
exports.submitHelpRequest = async (req, res) => {
  try {
    const { name, phone, email, helpType, message } = req.body;
    if (!name || !phone || !message) {
      return res.status(400).json({ success: false, message: 'Name, phone and message are required' });
    }
    const request = await PublicHelpRequest.create({
      name: name.trim(),
      phone: phone.trim(),
      email: email?.trim() || '',
      helpType: helpType || 'general',
      message: message.trim()
    });
    res.status(201).json({
      success: true,
      message: 'Your request has been submitted. An NGO representative will contact you within 24 hours.',
      data: request
    });
  } catch (error) {
    console.error('submitHelpRequest error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit request' });
  }
};

// GET HELP REQUESTS BY PHONE — no auth required
exports.getPublicHelpRequests = async (req, res) => {
  try {
    const { phone } = req.query;
    if (!phone) return res.json({ success: true, data: [] });
    const digits = phone.replace(/\D/g, '').replace(/^(0091|91)/, '');
    if (!digits) return res.json({ success: true, data: [] });
    const requests = await PublicHelpRequest.find({
      phone: { $regex: digits, $options: 'i' }
    }).sort('-createdAt');
    res.json({ success: true, data: requests });
  } catch (error) {
    console.error('getPublicHelpRequests error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch requests' });
  }
};
