const User = require('../models/User');
const Availability = require('../models/Availability');

// @desc    Get all doctors
// @route   GET /api/doctors
// @access  Public
exports.getDoctors = async (req, res, next) => {
  try {
    const { specialization, search } = req.query;
    
    let query = { role: 'doctor', isActive: true };

    if (specialization) {
      query.specialization = new RegExp(specialization, 'i');
    }

    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { specialization: new RegExp(search, 'i') }
      ];
    }

    const doctors = await User.find(query)
      .select('-password')
      .sort('-rating');

    res.status(200).json({
      success: true,
      count: doctors.length,
      data: doctors
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single doctor
// @route   GET /api/doctors/:id
// @access  Public
exports.getDoctor = async (req, res, next) => {
  try {
    const doctor = await User.findById(req.params.id).select('-password');

    if (!doctor || doctor.role !== 'doctor') {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    // Get availability
    const availability = await Availability.find({ 
      doctor: req.params.id,
      isActive: true
    });

    res.status(200).json({
      success: true,
      data: {
        ...doctor.toObject(),
        availability
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Set doctor availability
// @route   POST /api/doctors/availability
// @access  Private (Doctor)
exports.setAvailability = async (req, res, next) => {
  try {
    const { day, startTime, endTime } = req.body;

    const availability = await Availability.create({
      doctor: req.user.id,
      day,
      startTime,
      endTime
    });

    res.status(201).json({
      success: true,
      data: availability
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get doctor availability
// @route   GET /api/doctors/availability
// @access  Private (Doctor)
exports.getAvailability = async (req, res, next) => {
  try {
    const availability = await Availability.find({ 
      doctor: req.user.id,
      isActive: true
    });

    res.status(200).json({
      success: true,
      count: availability.length,
      data: availability
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete availability slot
// @route   DELETE /api/doctors/availability/:id
// @access  Private (Doctor)
exports.deleteAvailability = async (req, res, next) => {
  try {
    const availability = await Availability.findById(req.params.id);

    if (!availability) {
      return res.status(404).json({
        success: false,
        message: 'Availability slot not found'
      });
    }

    if (availability.doctor.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    await availability.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Search doctors by symptoms
// @route   POST /api/doctors/search-by-symptoms
// @access  Public
exports.searchBySymptoms = async (req, res, next) => {
  try {
    const { symptoms } = req.body;

    if (!symptoms || symptoms.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide symptoms'
      });
    }

    // Symptom to specialization mapping
    const symptomMapping = {
      'fever': ['General Physician', 'Internal Medicine'],
      'headache': ['General Physician', 'Neurologist'],
      'chest pain': ['Cardiologist'],
      'breathing': ['Pulmonologist', 'Cardiologist'],
      'skin': ['Dermatologist'],
      'stomach': ['Gastroenterologist'],
      'joint': ['Orthopedist', 'Rheumatologist'],
      'anxiety': ['Psychiatrist', 'Psychologist'],
      'depression': ['Psychiatrist', 'Psychologist'],
      'eye': ['Ophthalmologist'],
      'ear': ['ENT Specialist'],
      'tooth': ['Dentist']
    };

    // Find matching specializations
    const specializations = new Set();
    symptoms.forEach(symptom => {
      const lowerSymptom = symptom.toLowerCase();
      Object.keys(symptomMapping).forEach(key => {
        if (lowerSymptom.includes(key)) {
          symptomMapping[key].forEach(spec => specializations.add(spec));
        }
      });
    });

    // If no match, return general physicians
    if (specializations.size === 0) {
      specializations.add('General Physician');
    }

    const doctors = await User.find({
      role: 'doctor',
      specialization: { $in: Array.from(specializations) },
      isActive: true
    }).select('-password').sort('-rating');

    res.status(200).json({
      success: true,
      matchedSpecializations: Array.from(specializations),
      count: doctors.length,
      data: doctors
    });
  } catch (error) {
    next(error);
  }
};
