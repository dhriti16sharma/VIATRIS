const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const getOTPExpiry = () => {
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + 10); // 10 minutes expiry
  return expiry;
};

const sendOTP = async (phone, otp) => {
  // For development: print OTP in terminal
  console.log("=================================");
  console.log("OTP SENT TO:", phone);
  console.log("OTP:", otp);
  console.log("=================================");
};

const verifyOTP = (enteredOTP, storedOTP, expiry) => {

  console.log("Entered OTP:", enteredOTP);
  console.log("Stored OTP:", storedOTP);

  if (!enteredOTP || !storedOTP) {
    return {
      success: false,
      message: "OTP missing"
    };
  }

  // Convert to string to avoid type mismatch
  enteredOTP = enteredOTP.toString();
  storedOTP = storedOTP.toString();

  if (enteredOTP !== storedOTP) {
    return {
      success: false,
      message: "Invalid OTP"
    };
  }

  if (new Date() > new Date(expiry)) {
    return {
      success: false,
      message: "OTP expired"
    };
  }

  return {
    success: true,
    message: "OTP verified"
  };
};

module.exports = {
  generateOTP,
  getOTPExpiry,
  sendOTP,
  verifyOTP
};