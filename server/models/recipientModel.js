const mongoose = require("mongoose");

const recipientSchema = new mongoose.Schema(
  {
    instanceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BotInstance",
      required: true,
    },
    email: { type: String, required: true },
    name: { type: String },
    phone: { type: String },
    company: { type: String },
    status: { type: String, enum: ["active", "inactive"], default: "active" }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Recipient", recipientSchema);