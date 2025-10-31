const mongoose = require("mongoose");
const Bot = require('../models/botModel');
const bots = require('../data/bots.json');

const connectDB = async () => {
  try {
    mongoose.set("strictQuery", false);
    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(`MongoDB Connected: ${conn.connection.host}`);

    seedBots();
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
};

const seedBots = async () => {
  try {
    for (const bot of bots) {
      // Avoid duplicates
      const exists = await Bot.findOne({ key: bot.key });
      if (!exists) {
        await Bot.create(bot);
        console.log(`Bot "${bot.key}" added`);
      }
    }
    console.log('Seeding completed');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

module.exports = connectDB;
