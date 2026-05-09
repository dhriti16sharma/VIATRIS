const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
    // optional — patients in this system are anonymous (not User accounts)
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // token links this prescription to a specific booking/appointment
  token: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Token'
  },
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  // Free-text medications field used by the doctor dashboard
  medicationsText: {
    type: String,
    default: ''
  },
  diagnosis: {
    type: String,
    required: true
  },
  medications: [{
    name: { type: String },
    dosage: { type: String },
    frequency: { type: String },
    duration: { type: String },
    instructions: String
  }],
  additionalInstructions: String,
  followUpDate: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient querying
prescriptionSchema.index({ patient: 1, createdAt: -1 });
prescriptionSchema.index({ doctor: 1, createdAt: -1 });

module.exports = mongoose.model('Prescription', prescriptionSchema);
