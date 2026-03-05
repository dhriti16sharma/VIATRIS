const express = require('express');
const router = express.Router();
const { sendMessage, getChatbotInfo } = require('../controllers/chatbotController');

// Public routes - no authentication needed
router.post('/message', sendMessage);
router.get('/info', getChatbotInfo);

module.exports = router;
