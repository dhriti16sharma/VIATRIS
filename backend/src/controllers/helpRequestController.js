const HelpRequest = require('../models/HelpRequest');

// @desc    Create help request
// @route   POST /api/help-requests
// @access  Private (Patient)
exports.createHelpRequest = async (req, res, next) => {
  try {
    const { problem, financialDetails, urgency, location, prescriptions } = req.body;

    const helpRequest = await HelpRequest.create({
      patient: req.user.id,
      problem,
      financialDetails,
      urgency,
      location,
      prescriptions
    });

    const populatedRequest = await HelpRequest.findById(helpRequest._id)
      .populate('patient', 'name email phone address')
      .populate('prescriptions');

    res.status(201).json({
      success: true,
      data: populatedRequest
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get help requests
// @route   GET /api/help-requests
// @access  Private
exports.getHelpRequests = async (req, res, next) => {
  try {
    let query;

    if (req.user.role === 'patient') {
      query = { patient: req.user.id };
    } else if (req.user.role === 'ngo') {
      // NGOs can see all requests or only assigned ones
      const { status, urgency, assigned } = req.query;
      query = {};
      
      if (assigned === 'true') {
        query.assignedNGO = req.user.id;
      }
      
      if (status) {
        query.status = status;
      }
      
      if (urgency) {
        query.urgency = urgency;
      }
    } else {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    const helpRequests = await HelpRequest.find(query)
      .populate('patient', 'name email phone address')
      .populate('prescriptions')
      .populate('assignedNGO', 'name ngoName email')
      .sort('-urgency -createdAt');

    res.status(200).json({
      success: true,
      count: helpRequests.length,
      data: helpRequests
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single help request
// @route   GET /api/help-requests/:id
// @access  Private
exports.getHelpRequest = async (req, res, next) => {
  try {
    const helpRequest = await HelpRequest.findById(req.params.id)
      .populate('patient', 'name email phone address')
      .populate('prescriptions')
      .populate({
        path: 'prescriptions',
        populate: {
          path: 'doctor',
          select: 'name specialization'
        }
      })
      .populate('assignedNGO', 'name ngoName email');

    if (!helpRequest) {
      return res.status(404).json({
        success: false,
        message: 'Help request not found'
      });
    }

    // Check authorization
    if (req.user.role === 'patient' && helpRequest.patient._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this request'
      });
    }

    res.status(200).json({
      success: true,
      data: helpRequest
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update help request status
// @route   PUT /api/help-requests/:id
// @access  Private (NGO)
exports.updateHelpRequest = async (req, res, next) => {
  try {
    let helpRequest = await HelpRequest.findById(req.params.id);

    if (!helpRequest) {
      return res.status(404).json({
        success: false,
        message: 'Help request not found'
      });
    }

    const { status, ngoNotes, resolution } = req.body;

    // Auto-assign NGO if not already assigned
    if (!helpRequest.assignedNGO) {
      helpRequest.assignedNGO = req.user.id;
    }

    if (status) helpRequest.status = status;
    if (ngoNotes) helpRequest.ngoNotes = ngoNotes;
    if (resolution) helpRequest.resolution = resolution;

    await helpRequest.save();

    helpRequest = await HelpRequest.findById(req.params.id)
      .populate('patient', 'name email phone address')
      .populate('prescriptions')
      .populate('assignedNGO', 'name ngoName email');

    res.status(200).json({
      success: true,
      data: helpRequest
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get help requests by location
// @route   GET /api/help-requests/nearby/:distance
// @access  Private (NGO)
exports.getNearbyRequests = async (req, res, next) => {
  try {
    const { longitude, latitude } = req.query;
    const distance = req.params.distance || 10; // default 10km

    if (!longitude || !latitude) {
      return res.status(400).json({
        success: false,
        message: 'Please provide longitude and latitude'
      });
    }

    // Convert distance to radians
    const radius = distance / 6371; // Earth's radius in km

    const helpRequests = await HelpRequest.find({
      location: {
        $geoWithin: {
          $centerSphere: [[longitude, latitude], radius]
        }
      },
      status: { $in: ['pending', 'in-progress'] }
    })
      .populate('patient', 'name email phone')
      .populate('prescriptions')
      .sort('-urgency -createdAt');

    res.status(200).json({
      success: true,
      count: helpRequests.length,
      data: helpRequests
    });
  } catch (error) {
    next(error);
  }
};
