const mongoose = require('mongoose');
const { nodeSchema, edgeSchema, brandingSchema, integrationSchema } = require('./schemas');

const botSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String },
  plan: { type: String, enum: ['basic', 'custom'], default: 'basic' },
  emoji: { type: String },
  builtin: { type: Boolean, default: true },
  hide: { type: Boolean, default: false },
  nodes: { 
    basic: [nodeSchema],
    custom: [nodeSchema],
  },
  edges: { 
    basic: [edgeSchema],
    custom: [edgeSchema],
  },
  branding: brandingSchema,
  integrations: integrationSchema,
  starterSeq: [{ type: mongoose.Schema.Types.Mixed }]
}, { timestamps: true });

module.exports = mongoose.model('Bot', botSchema);