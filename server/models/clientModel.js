const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  name:  { type: String, required: true },
  email:     { type: String, required: true },
  plan:     { type: String },
  defaultBot:  { type: String },
  status: { type: String, enum: ['Active', 'Paused'], required: true, default: 'Active' },
});

module.exports = mongoose.model('client', clientSchema);