const BotInstance = require('../models/botInstanceModel');
const Bot = require('../models/botModel');

const getBotById = async (req, res) => {
  try {
    const bot = await Bot.findById(req.params.id);
    res.json(bot);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

const getAllBots = async (req, res) => {
  try {
    const bots = await Bot.find();
    res.json(bots);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createBot = async (req, res) => {
  try {
    const botData = { ...req.body, builtin: false};

    const newBot = new Bot(botData);
    const savedBot = await newBot.save();
    res.status(201).json(savedBot);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const updateBot = async (req, res) => {
  try {
    const updateData = { ...req.body };

    const bot = await Bot.findById(req.params.id);
    if (!bot) return res.status(404).json({ error: 'Bot template not found' });

    Object.keys(updateData).forEach((key) => {
      bot[key] = updateData[key];
    });

    const updatedBot = await bot.save();
    res.json(updatedBot);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const deleteBot = async (req, res) => {
  try {
    const bot = await Bot.findById(req.params.id);
    if (bot.builtin) {
      bot.hide = true;
      await bot.save();
      res.json({ message: 'Bot hidden' });
    } else {
      await Bot.findByIdAndDelete(req.params.id);
      res.json({ message: 'Bot deleted' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const duplicateInstanceFromBot = async (req, res) => {
  try {
    const bot = await Bot.findById(req.params.id);
    if (!bot) {
      return res.status(404).json({ error: 'Bot not found' });
    }

    const newInst = new BotInstance({
      botId: bot._id,
      name: req.body.name,
      plan: req.body.plan,
      botKey: bot.key,
      nodes: bot.nodes,
      edges: bot.edges
    });

    const savedInst = await newInst.save();
    res.status(201).json(savedInst);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getBotById,
  getAllBots,
  createBot,
  updateBot,
  deleteBot,
  duplicateInstanceFromBot
};
