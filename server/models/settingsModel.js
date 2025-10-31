const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  key: { type: String, required: true },
  mode: { type: String, enum: ['basic', 'custom'], default: 'basic' },
  domain: { type: String, default: ''},
  language: { type: String, default: 'English'},
  darkMode: { type: Boolean, default: false },
  defaultBot: { type: mongoose.Schema.Types.ObjectId, ref: "Bot", default: null },
  consentText: { type: String, default: 'By continuing, you agree to our Terms and Privacy Policy.' },
  brandLogoDataUrl: { type: String, default: '' },
  emailNotifications: { type: Boolean, default: false },
  notifyEmail: { type: String, default: '' },
  palette: {
    from: { type: String, default: '#c4b5fd' },
    via: { type: String, default: '#a5b4fc' },
    to: { type: String, default: '#86efac' },
  },
  syncMode: { type: String, enum: ['local', 'digitalocean'], default: 'local' },
  lastCloudBackupAt: { type: Date, default: null }
});

module.exports = mongoose.model('Settings', settingsSchema);