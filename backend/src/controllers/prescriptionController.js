const Prescription = require('../models/Prescription');
const User = require('../models/User');

// @desc    Create prescription
// @route   POST /api/prescriptions
// @access  Private (Doctor)
exports.createPrescription = async (req, res, next) => {
  try {
    const { patient, appointment, diagnosis, medications, additionalInstructions, followUpDate } = req.body;

    // Verify patient exists
    const patientUser = await User.findById(patient);
    if (!patientUser || patientUser.role !== 'patient') {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    const prescription = await Prescription.create({
      patient,
      doctor: req.user.id,
      appointment,
      diagnosis,
      medications,
      additionalInstructions,
      followUpDate
    });

    const populatedPrescription = await Prescription.findById(prescription._id)
      .populate('patient', 'name email phone')
      .populate('doctor', 'name specialization');

    res.status(201).json({
      success: true,
      data: populatedPrescription
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get prescriptions
// @route   GET /api/prescriptions
// @access  Private
exports.getPrescriptions = async (req, res, next) => {
  try {
    let query;

    if (req.user.role === 'patient') {
      query = { patient: req.user.id };
    } else if (req.user.role === 'doctor') {
      query = { doctor: req.user.id };
    } else {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    const prescriptions = await Prescription.find(query)
      .populate('patient', 'name email phone')
      .populate('doctor', 'name specialization')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: prescriptions.length,
      data: prescriptions
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single prescription
// @route   GET /api/prescriptions/:id
// @access  Private
exports.getPrescription = async (req, res, next) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate('patient', 'name email phone')
      .populate('doctor', 'name specialization');

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }

    // Check ownership
    if (prescription.patient._id.toString() !== req.user.id &&
        prescription.doctor._id.toString() !== req.user.id &&
        req.user.role !== 'ngo') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this prescription'
      });
    }

    res.status(200).json({
      success: true,
      data: prescription
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update prescription
// @route   PUT /api/prescriptions/:id
// @access  Private (Doctor)
exports.updatePrescription = async (req, res, next) => {
  try {
    let prescription = await Prescription.findById(req.params.id);

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }

    // Only the doctor who created it can update
    if (prescription.doctor.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this prescription'
      });
    }

    prescription = await Prescription.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).populate('patient', 'name email phone')
     .populate('doctor', 'name specialization');

    res.status(200).json({
      success: true,
      data: prescription
    });
  } catch (error) {
    next(error);
  }
};
