const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  botInstanceId: {
    type: mongoose.Schema.Types.Mixed
  },
  botKey: {
    type: String,
  },
  captureLevel: {
    type: String,
    enum: ['partial', 'full'],
    default: 'partial',
  },
  capturedAt: {
    type: Date,
    default: Date.now,
  },
  name: {
    type: String,
    default: '',
  },
  email: {
    type: String,
    default: '',
  },
  phone: {
    type: String,
    default: '',
  },
  company: {
    type: String,
    default: '',
  },
  message: {
    type: String,
    default: '',
  },
  answers: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  tags: [{
    type: String,
  }],
  score: {
    type: Number,
    default: 0,
  },
  source: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['new', 'contacted', 'qualified', 'unqualified', 'booked', 'closed'],
    default: 'new',
  },
}, { timestamps: true });

module.exports = mongoose.model('Lead', leadSchema);
