const aiService = require('../services/aiService');

// @desc    Analyze symptoms with AI
// @route   POST /api/ai/analyze-symptoms
// @access  Private (Patient)
exports.analyzeSymptoms = async (req, res, next) => {
  try {
    const { symptoms, patientHistory } = req.body;

    if (!symptoms || symptoms.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide symptoms'
      });
    }

    const analysis = await aiService.analyzeSymptoms(symptoms, patientHistory);

    res.status(200).json({
      success: true,
      data: analysis
    });
  } catch (error) {
    // If OpenAI API fails, provide fallback response
    if (error.response?.status === 401) {
      return res.status(200).json({
        success: true,
        data: {
          possibleConditions: ['Unable to perform AI analysis - API key not configured'],
          recommendedSpecialization: ['General Physician'],
          urgencyLevel: 'medium',
          advice: 'Please consult a healthcare professional for accurate diagnosis.',
          disclaimer: 'AI service temporarily unavailable. Please consult a healthcare professional.',
          fallback: true
        }
      });
    }
    next(error);
  }
};

// @desc    Chat with AI assistant
// @route   POST /api/ai/chat
// @access  Private
exports.chat = async (req, res, next) => {
  try {
    const { message, conversationHistory } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a message'
      });
    }

    const response = await aiService.chatWithAI(message, conversationHistory || []);

    res.status(200).json({
      success: true,
      data: response
    });
  } catch (error) {
    if (error.response?.status === 401) {
      return res.status(200).json({
        success: true,
        data: {
          message: 'AI chat service is temporarily unavailable. Please try again later or contact support.',
          role: 'assistant',
          fallback: true
        }
      });
    }
    next(error);
  }
};

// @desc    Get prescription suggestions
// @route   POST /api/ai/prescription-suggestions
// @access  Private (Doctor)
exports.getPrescriptionSuggestions = async (req, res, next) => {
  try {
    const { diagnosis, patientAge, allergies } = req.body;

    if (!diagnosis || !patientAge) {
      return res.status(400).json({
        success: false,
        message: 'Please provide diagnosis and patient age'
      });
    }

    const suggestions = await aiService.generatePrescriptionSuggestions(
      diagnosis,
      patientAge,
      allergies || []
    );

    res.status(200).json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    if (error.response?.status === 401) {
      return res.status(200).json({
        success: true,
        data: {
          medications: [],
          disclaimer: 'AI prescription service temporarily unavailable. Please use clinical judgment.',
          fallback: true
        }
      });
    }
    next(error);
  }
};

// @desc    Analyze medical report
// @route   POST /api/ai/analyze-report
// @access  Private
exports.analyzeReport = async (req, res, next) => {
  try {
    const { reportText } = req.body;

    if (!reportText) {
      return res.status(400).json({
        success: false,
        message: 'Please provide report text'
      });
    }

    const analysis = await aiService.analyzeMedicalReport(reportText);

    res.status(200).json({
      success: true,
      data: analysis
    });
  } catch (error) {
    if (error.response?.status === 401) {
      return res.status(200).json({
        success: true,
        data: {
          keyFindings: [],
          concerningValues: [],
          recommendations: [],
          overallAssessment: 'AI report analysis temporarily unavailable.',
          fallback: true
        }
      });
    }
    next(error);
  }
};

// @desc    Get health tips
// @route   GET /api/ai/health-tips
// @access  Public
exports.getHealthTips = async (req, res, next) => {
  try {
    const { category } = req.query;

    const tips = await aiService.getHealthTips(category || 'general');

    res.status(200).json({
      success: true,
      data: tips
    });
  } catch (error) {
    if (error.response?.status === 401) {
      return res.status(200).json({
        success: true,
        data: {
          tips: [
            'Drink plenty of water throughout the day',
            'Get 7-8 hours of sleep each night',
            'Exercise regularly for at least 30 minutes',
            'Eat a balanced diet with fruits and vegetables',
            'Manage stress through relaxation techniques'
          ],
          category: 'general',
          fallback: true
        }
      });
    }
    next(error);
  }
};
