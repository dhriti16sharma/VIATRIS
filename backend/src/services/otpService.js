const axios = require('axios');

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const getOTPExpiry = () => {
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + 10);
  return expiry;
};

// Send OTP via all available channels (email via Resend, SMS via Fast2SMS)
const sendOTP = async (phone, otp, email = null) => {

  // ── Email OTP via Resend ─────────────────────────────────────────────────
  if (email && process.env.RESEND_API_KEY) {
    try {
      await axios.post(
        'https://api.resend.com/emails',
        {
          from: 'Viatris Health <onboarding@resend.dev>',
          to: email,
          subject: 'Your Viatris Health OTP',
          html: `
            <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #FAF7F2; border-radius: 16px;">
              <div style="text-align: center; margin-bottom: 24px;">
                <span style="font-size: 28px; color: #2C2C2C;">✿ <strong>Viatris Health</strong></span>
              </div>
              <h2 style="color: #2C2C2C; margin-bottom: 8px;">Your Appointment OTP</h2>
              <p style="color: #5C5C5C; margin-bottom: 24px;">Use this OTP to confirm your appointment. Valid for <strong>10 minutes</strong>.</p>
              <div style="background: white; border: 2px solid #7D9B76; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
                <span style="font-size: 40px; font-weight: 700; letter-spacing: 12px; color: #4A6B44; font-family: monospace;">${otp}</span>
              </div>
              <p style="color: #9C9C9C; font-size: 13px;">Do not share this OTP with anyone. If you did not request this, please ignore this email.</p>
            </div>
          `
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log('OTP email sent via Resend to:', email);
    } catch (err) {
      console.error('Resend email error (booking continues):', err.response?.data || err.message);
    }
  } else if (email) {
    console.log('RESEND_API_KEY not set — email OTP skipped.');
  }

  // ── SMS OTP via Fast2SMS (Indian numbers) ────────────────────────────────
  if (process.env.FAST2SMS_API_KEY) {
    try {
      const digits = phone.replace(/\D/g, '').replace(/^(91|0)/, '').slice(-10);
      const response = await axios.post(
        'https://www.fast2sms.com/dev/bulkV2',
        {
          authorization: process.env.FAST2SMS_API_KEY,
          variables_values: otp,
          route: 'v3',
          numbers: digits
        },
        {
          headers: { authorization: process.env.FAST2SMS_API_KEY }
        }
      );
      console.log('[Fast2SMS] Response:', response.data);
    } catch (err) {
      console.error('[Fast2SMS] Error:', err.response?.data || err.message);
    }
  } else {
    console.log('[Fast2SMS] API key not set — SMS skipped.');
  }
};

const verifyOTP = (enteredOTP, storedOTP, expiry) => {
  if (!enteredOTP || !storedOTP) {
    return { success: false, message: 'OTP missing' };
  }

  enteredOTP = enteredOTP.toString();
  storedOTP = storedOTP.toString();

  if (enteredOTP !== storedOTP) {
    return { success: false, message: 'Invalid OTP' };
  }

  if (new Date() > new Date(expiry)) {
    return { success: false, message: 'OTP expired' };
  }

  return { success: true, message: 'OTP verified' };
};

module.exports = {
  generateOTP,
  getOTPExpiry,
  sendOTP,
  verifyOTP
};
