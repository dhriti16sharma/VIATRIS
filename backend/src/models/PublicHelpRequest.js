const mongoose = require('mongoose');

const publicHelpRequestSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  phone:    { type: String, required: true, trim: true },
  email:    { type: String, trim: true, default: '' },
  helpType: {
    type: String,
    enum: ['financial', 'medicine', 'transport', 'mental_health', 'general'],
    default: 'general'
  },
  message:  { type: String, required: true },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'resolved'],
    default: 'pending'
  },
  ngoNotes:    { type: String, default: '' },
  actionTaken: { type: String, default: '' }
}, { timestamps: true });

publicHelpRequestSchema.index({ phone: 1 });
publicHelpRequestSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('PublicHelpRequest', publicHelpRequestSchema);
