require("dotenv").config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const path = require('path');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

// Strict rate limiter for OTP endpoints — 5 attempts per 15 minutes per IP
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many OTP attempts. Please wait 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Connect to database
connectDB();

const app = express();

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Enable CORS
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
  credentials: true
}));

// Security headers
app.use(helmet());

// Compression
app.use(compression());

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Mount routers
app.use('/api/auth', require('./routes/auth'));

// Apply OTP rate limiter to booking and OTP verification only
app.use(['/api/public/book-appointment', '/api/public/verify-otp'], otpLimiter);
app.use('/api/public', require('./routes/public'));
app.use('/api/tokens', require('./routes/tokens'));
app.use('/api/doctors', require('./routes/doctors'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/prescriptions', require('./routes/prescriptions'));
app.use('/api/help-requests', require('./routes/helpRequests'));
app.use('/api/chatbot', require('./routes/chatbot'));
app.use('/api/ai', require('./routes/ai'));

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Healthcare API - All Features Working + AI Chatbot',
    features: {
      directBooking: true,
      languageToggle: true,
      doctorNameDisplay: true,
      imageUpload: true,
      multiUser: true,
      tokenSystem: true,
      otpVerification: true,
      crudOperations: true,
      sessionTimeout: true,
      aiChatbot: true  // NEW
    },
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`✓ Server running on port ${PORT}`);
  console.log(`✓ All 9 features + AI Chatbot enabled`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  server.close(() => process.exit(1));
});


module.exports = app;
