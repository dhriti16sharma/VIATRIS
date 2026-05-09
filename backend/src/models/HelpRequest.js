const mongoose = require('mongoose');

const helpRequestSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  problem: {
    type: String,
    required: true
  },
  financialDetails: {
    type: String,
    required: true
  },
  urgency: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    },
    address: String
  },
  prescriptions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prescription'
  }],
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'resolved', 'rejected'],
    default: 'pending'
  },
  assignedNGO: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  ngoNotes: { type: String, default: '' },
  actionTaken: { type: String, default: '' },
  contactedAt: { type: Date },
  resolvedAt: { type: Date },
  resolution: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for geospatial queries
helpRequestSchema.index({ location: '2dsphere' });
helpRequestSchema.index({ status: 1, urgency: -1 });
helpRequestSchema.index({ patient: 1 });

module.exports = mongoose.model('HelpRequest', helpRequestSchema);
