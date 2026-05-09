const Prescription = require('../models/Prescription');
const Token = require('../models/Token');

// @desc    Create prescription linked to a Token (appointment)
// @route   POST /api/prescriptions
// @access  Private (Doctor)
exports.createPrescription = async (req, res) => {
  try {
    const { tokenId, diagnosis, medications, instructions, followUpDate } = req.body;

    if (!tokenId || !diagnosis) {
      return res.status(400).json({ success: false, message: 'tokenId and diagnosis are required' });
    }

    const token = await Token.findById(tokenId);
    if (!token) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    // Upsert: update existing prescription for this token+doctor, or create new
    let prescription = await Prescription.findOne({ token: tokenId, doctor: req.user._id });

    if (prescription) {
      prescription.diagnosis = diagnosis;
      prescription.medicationsText = medications || '';
      prescription.additionalInstructions = instructions || '';
      prescription.followUpDate = followUpDate || null;
      await prescription.save();
    } else {
      prescription = await Prescription.create({
        token: tokenId,
        doctor: req.user._id,
        diagnosis,
        medicationsText: medications || '',
        additionalInstructions: instructions || '',
        followUpDate: followUpDate || null,
        medications: []
      });
    }

    const populated = await Prescription.findById(prescription._id)
      .populate('token', 'tokenNumber patient appointmentDate');

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    console.error('createPrescription error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to save prescription' });
  }
};

// @desc    Get all prescriptions written by this doctor
// @route   GET /api/prescriptions
// @access  Private (Doctor)
exports.getPrescriptions = async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ doctor: req.user._id })
      .populate('token', 'tokenNumber patient appointmentDate')
      .sort('-createdAt');

    res.status(200).json({ success: true, count: prescriptions.length, data: prescriptions });
  } catch (error) {
    console.error('getPrescriptions error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch prescriptions' });
  }
};

// @desc    Get single prescription
// @route   GET /api/prescriptions/:id
// @access  Private
exports.getPrescription = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate('token', 'tokenNumber patient appointmentDate');

    if (!prescription) {
      return res.status(404).json({ success: false, message: 'Prescription not found' });
    }

    if (prescription.doctor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    res.status(200).json({ success: true, data: prescription });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get prescriptions for a token (public — patient looks up by tokenId)
// @route   GET /api/prescriptions/public?tokenId=X
// @access  Public
exports.getPrescriptionByToken = async (req, res) => {
  try {
    const { tokenId } = req.query;
    if (!tokenId) {
      return res.status(400).json({ success: false, message: 'tokenId is required' });
    }
    const prescriptions = await Prescription.find({ token: tokenId })
      .populate('doctor', 'name specialization')
      .populate('token', 'tokenNumber patient appointmentDate')
      .sort('-createdAt');
    res.status(200).json({ success: true, count: prescriptions.length, data: prescriptions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get prescriptions for multiple token IDs (public — patient portal)
// @route   GET /api/prescriptions/public?tokenIds=id1,id2,...
// @access  Public
exports.getPrescriptionsByTokenIds = async (req, res) => {
  try {
    const { tokenIds } = req.query;
    if (!tokenIds) return res.json({ success: true, data: [] });
    const ids = tokenIds.split(',').filter(Boolean);
    const prescriptions = await Prescription.find({ token: { $in: ids } })
      .populate('doctor', 'name specialization')
      .populate('token', 'tokenNumber patient appointmentDate');
    res.json({ success: true, data: prescriptions });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch prescriptions' });
  }
};

// @desc    Update prescription
// @route   PUT /api/prescriptions/:id
// @access  Private (Doctor)
exports.updatePrescription = async (req, res) => {
  try {
    let prescription = await Prescription.findById(req.params.id);

    if (!prescription) {
      return res.status(404).json({ success: false, message: 'Prescription not found' });
    }

    if (prescription.doctor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    prescription = await Prescription.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: false
    }).populate('token', 'tokenNumber patient appointmentDate');

    res.status(200).json({ success: true, data: prescription });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
