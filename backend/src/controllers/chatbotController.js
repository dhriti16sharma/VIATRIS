const chatbotService = require('../services/chatbotService');

// @desc    Chat with AI assistant
// @route   POST /api/chatbot/message
// @access  Public
exports.sendMessage = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Please provide a message'
      });
    }

    // Process message with chatbot service
    const result = chatbotService.processMessage(message);

    res.json({
      success: true,
      data: {
        userMessage: message,
        botResponse: result.response,
        type: result.type,
        details: result.data
      }
    });
  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process message. Please try again.'
    });
  }
};

// @desc    Get chatbot capabilities
// @route   GET /api/chatbot/info
// @access  Public
exports.getChatbotInfo = async (req, res) => {
  res.json({
    success: true,
    data: {
      name: 'HealthBot AI Assistant',
      capabilities: [
        {
          id: 1,
          title: 'Doctor Recommendation',
          description: 'Tell me your symptoms and I\'ll recommend which specialist to see',
          example: 'I have chest pain and shortness of breath'
        },
        {
          id: 2,
          title: 'OTC Medications',
          description: 'Get suggestions for over-the-counter medicines for common ailments',
          example: 'What medicine for headache?'
        },
        {
          id: 3,
          title: 'Medical Terms Explanation',
          description: 'Understand prescription terminology and medical jargon',
          example: 'What does BID mean?'
        }
      ],
      disclaimer: 'This AI assistant provides general information only and is not a substitute for professional medical advice. Always consult a qualified healthcare provider for medical concerns.'
    }
  });
};
