const aiService = require('../services/aiService');
const chatbotService = require('../services/chatbotService');

// @desc    Chat with AI assistant (Viatris AI)
// @route   POST /api/chatbot/message
// @access  Public
exports.sendMessage = async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({ success: false, message: 'Please provide a message' });
    }

    let botResponse;

    // Use AI service if any provider key is configured, otherwise rule-based fallback
    const hasAIProvider = process.env.GROQ_API_KEY || process.env.OPENROUTER_API_KEY ||
                          process.env.GEMINI_API_KEY || process.env.COHERE_API_KEY;

    if (hasAIProvider) {
      try {
        const result = await aiService.chatWithAI(message, history);
        botResponse = result.message;
      } catch (aiError) {
        console.error('AI service failed, falling back to rule-based chatbot:', aiError.message);
        const result = chatbotService.processMessage(message);
        botResponse = result.response;
      }
    } else {
      const result = chatbotService.processMessage(message);
      botResponse = result.response;
    }

    res.json({
      success: true,
      data: {
        userMessage: message,
        botResponse,
        type: 'chat'
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
      name: 'Viatris Health AI',
      capabilities: [
        { id: 1, title: 'Symptom Guidance', description: 'Understand what symptoms might indicate and when to see a doctor' },
        { id: 2, title: 'Medical Terminology', description: 'Explain medical words and prescription terms in simple language' },
        { id: 3, title: 'Wellness Tips', description: 'General advice on sleep, diet, exercise, and stress management' }
      ],
      disclaimer: 'Viatris AI provides general health information only and is not a substitute for professional medical advice.'
    }
  });
};
