const express = require('express');
const router = express.Router();
const {
  bookAppointment,
  verifyOTP,
  getDoctors,
  getAppointmentsByPhone
} = require('../controllers/publicController');

router.post('/book-appointment', bookAppointment);
router.post('/verify-otp', verifyOTP);
router.get('/doctors', getDoctors);
router.get('/appointments', getAppointmentsByPhone);

module.exports = router;
