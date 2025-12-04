const mongoose = require("mongoose");

const crmEventSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      required: true,
      index: true,
    },
    eventType: {
      type: String,
      index: true,
    },
    objectType: {
      type: String,
      index: true,
    },
    objectId: {
      type: String,
      index: true,
    },
    eventId: {
      type: String,
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

crmEventSchema.index({ provider: 1, eventType: 1 });
crmEventSchema.index({ objectType: 1, objectId: 1, timestamp: -1 });

const CrmEvent = mongoose.model("CrmEvent", crmEventSchema);

module.exports = CrmEvent;


