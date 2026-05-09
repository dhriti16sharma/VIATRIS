const express = require('express');
const router = express.Router();
const {
  bookAppointment,
  verifyOTP,
  resendOTP,
  getDoctors,
  getAppointmentsByPhone,
  sendPortalOTP,
  verifyPortalOTP,
  cancelAppointment,
  submitHelpRequest,
  getPublicHelpRequests
} = require('../controllers/publicController');

router.post('/book-appointment', bookAppointment);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.get('/doctors', getDoctors);
router.get('/appointments', getAppointmentsByPhone);
router.post('/send-portal-otp', sendPortalOTP);
router.post('/verify-portal-otp', verifyPortalOTP);
router.put('/cancel-appointment', cancelAppointment);
router.post('/help-request', submitHelpRequest);
router.get('/help-requests', getPublicHelpRequests);

module.exports = router;
