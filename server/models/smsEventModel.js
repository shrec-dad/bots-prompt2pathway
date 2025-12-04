const mongoose = require("mongoose");

const smsEventSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      enum: ["twilio", "plivo", "messagebird", "generic"],
      required: true,
    },
    direction: {
      type: String,
      enum: ["inbound", "outbound", "status"],
      required: true,
    },
    eventType: {
      type: String, // e.g. inbound_message, delivery_report, status_update
      required: true,
    },
    messageId: {
      type: String,
      required: true,
      index: true,
    },
    from: { type: String, required: true, index: true },
    to: { type: String, required: true, index: true },
    status: { type: String },        // delivered, failed, sent, received, etc.
    errorCode: { type: String },
    text: { type: String },          // message body (for inbound / outbound)
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
  { timestamps: true }
);

smsEventSchema.index({ provider: 1, eventType: 1 });
smsEventSchema.index({ from: 1, timestamp: -1 });
smsEventSchema.index({ to: 1, timestamp: -1 });
smsEventSchema.index({ messageId: 1, provider: 1 });

module.exports = mongoose.model("SmsEvent", smsEventSchema);