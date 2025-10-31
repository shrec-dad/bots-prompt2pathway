const mongoose = require('mongoose');

const docSchema = new mongoose.Schema(
  {
    botId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "botModelType",
      required: true,
    },
    botModelType: {
      type: String,
      required: true,
      enum: ["Bot", "BotInstance"],
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    size: {
      type: Number,
      default: 0
    },
    url: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Doc', docSchema);