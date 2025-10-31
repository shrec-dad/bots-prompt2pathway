const mongoose = require('mongoose');

const nodeSchema = new mongoose.Schema({
  id: { type: String, required: true },
  type: { type: String, required: true },
  data: { type: mongoose.Schema.Types.Mixed, default: {} },
  position: {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
  },
}, { _id: false });

const edgeSchema = new mongoose.Schema({
  id: { type: String, required: true },
  source: { type: String, required: true },
  target: { type: String, required: true },
  type: { type: String, default: 'smoothstep' },
}, { _id: false });

const brandingSchema = new mongoose.Schema({
  mode: { type: String, enum: ['popup', 'inline', 'sidebar'], default: 'popup' },
  pos: { type: String, enum: ['bottom-right', 'bottom-left'], default: 'bottom-right'},
  shape: { type: String, enum: ['circle', 'rounded', 'square', 'oval', 'chat', 'badge', 'speech', 'speech-rounded'], default: 'circle'},
  size: { type: Number, default: 56 },
  label: { type: String, default: 'Chat' },
  labelColor: { type: String, default: '#ffffff' },
  bgColor: { type: String, default: '#7aa8ff' },
  font: { type: String, default: 'Inter, system-ui, Arial, sans-serif' },
  img: { type: String, default: '' },
  imageFit: { type: String, enum: ['cover', 'contain', 'center'], default: 'cover' },
  hideLabelWhenImage: { type: Boolean, default: false },
  borderColor: { type: String, default: '#000000' },
  botAvatar: { type: String, default: '' },
  panelStyle: { type: String, enum: ['step-by-step', 'conversation'], default: 'step-by-step' },
}, { _id: false });

const integrationSchema = new mongoose.Schema({
  emailWebhook: { type: String, default: '' },
  emailApiKey: { type: String, default: '' },
  calendarWebhook: { type: String, default: '' },
  calendarSecret: { type: String, default: '' },
  crmWebhook: { type: String, default: '' },
  crmAuthToken: { type: String, default: '' }
}, { _id: false });

module.exports = { nodeSchema, edgeSchema, brandingSchema, integrationSchema };