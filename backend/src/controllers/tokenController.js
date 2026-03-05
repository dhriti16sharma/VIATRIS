const Token = require('../models/Token');

// Get all tokens for logged-in doctor
exports.getTokens = async (req, res) => {
  try {
    const tokens = await Token.find({ doctor: req.user.id })
      .populate('doctor', 'name specialization')
      .sort('-appointmentDate');

    res.json({
      success: true,
      count: tokens.length,
      data: tokens
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get single token
exports.getToken = async (req, res) => {
  try {
    const token = await Token.findById(req.params.id)
      .populate('doctor', 'name specialization');

    if (!token) {
      return res.status(404).json({
        success: false,
        message: 'Token not found'
      });
    }

    // Check authorization
    if (token.doctor._id.toString() !== req.user.id && req.user.role !== 'ngo') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    res.json({
      success: true,
      data: token
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update token (doctor only)
exports.updateToken = async (req, res) => {
  try {
    let token = await Token.findById(req.params.id);

    if (!token) {
      return res.status(404).json({
        success: false,
        message: 'Token not found'
      });
    }

    // Check authorization
    if (token.doctor.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this token'
      });
    }

    token = await Token.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    res.json({
      success: true,
      data: token
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete token (doctor only)
exports.deleteToken = async (req, res) => {
  try {
    const token = await Token.findById(req.params.id);

    if (!token) {
      return res.status(404).json({
        success: false,
        message: 'Token not found'
      });
    }

    // Check authorization
    if (token.doctor.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this token'
      });
    }

    await token.deleteOne();

    res.json({
      success: true,
      message: 'Token deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
