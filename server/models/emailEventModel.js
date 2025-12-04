const mongoose = require("mongoose");

const emailEventSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      enum: ["sendgrid", "postmark", "mailgun", "ses", "smtp"],
      required: true,
    },
    eventType: {
      type: String,
      required: true,
    },
    messageId: {
      type: String,
      required: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      index: true,
    },
    timestamp: {
      type: Date,
      required: true,
      index: true,
    },
    rawData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    instanceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BotInstance",
      index: true,
    },
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Recipient",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

emailEventSchema.index({ provider: 1, eventType: 1 });
emailEventSchema.index({ email: 1, timestamp: -1 });
emailEventSchema.index({ messageId: 1, provider: 1 });

const EmailEvent = mongoose.model("EmailEvent", emailEventSchema);

module.exports = EmailEvent;

