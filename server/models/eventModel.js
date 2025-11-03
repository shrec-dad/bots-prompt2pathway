const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  key: { type: String, required: true },
  type: { type: String, required: true  },
  ts: { type: Number },
  meta: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

module.exports = mongoose.model('Event', EventSchema);
