const mongoose = require('mongoose');
const { nodeSchema, edgeSchema, brandingSchema, integrationSchema } = require('./schemas');

const botInstanceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  plan: { type: String, enum: ['basic', 'custom'], default: 'basic' },
  botKey: { type: String, required: true },
  botId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Bot",
    required: true,
  },
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
  days: [{
    enabled: { type: Boolean, default: false },
    subject: { type: String, default: "" },
    body: { type: String, default: "" } 
  }],
  daysCount: { type: String, default: "14" },
  scheduleMode: { type: String, enum: ['relative', 'calendar'], default: 'relative' },
  times: [{ type: String, default: "09:00" }],
  windows: [{
    start: { type: String, default: "08:00" }, 
    end: { type: String, default: "20:00" }
  }],
  dates: [{ type: String }],
  timezone: { type: String },
  quiet: {
    enabled: { type: Boolean, default: false },
    start: { type: String, default: "08:00" }, 
    end: { type: String, default: "20:00" }
  },
  channels: [{
    channel: { type: String, enum: ["email", "sms", "both"], default: "email" },
    smsBody: { type: String }
  }],
  delivery: {
    provider: { type: String, enum: ["sendgrid", "mailgun", "ses", "gmail", "smtp"], default: "smtp" },
    integrationAccountId: { type: String },
    fromName: { type: String },
    fromEmail: { type: String },
    replyTo: { type: String },
    tagPrefix: { type: String },
    defaultTime: { type: String }
  },
  previewOpts: {
    addUnsubscribeFooter: { type: Boolean, default: false },
    addTrackingPixelHint: { type: Boolean, default: false }
  }
}, { timestamps: true });

module.exports = mongoose.model('BotInstance', botInstanceSchema);