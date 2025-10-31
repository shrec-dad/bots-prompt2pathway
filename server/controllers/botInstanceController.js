const BotInstance = require('../models/botInstanceModel');

const getInstanceById = async (req, res) => {
  try {
    const inst = await BotInstance.findById(req.params.id);
    res.json(inst);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

const getAllInstances = async (req, res) => {
  try {
    const instances = await BotInstance.find().populate('botId', 'name emoji')
    res.json(instances);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createInstance = async (req, res) => {
  try {
    const instData = { ...req.body};

    const newInst = new BotInstance(instData);
    const savedInst = await newInst.save();
    res.status(201).json(savedInst);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const updateInstance = async (req, res) => {
  try {
    const updateData = { ...req.body };

    const instance = await BotInstance.findById(req.params.id);
    if (!instance) return res.status(404).json({ error: 'Bot Instance not found' });

    Object.keys(updateData).forEach((key) => {
      instance[key] = updateData[key];
    });

    const updatedInst = await instance.save();
    res.json(updatedInst);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const deleteInstance = async (req, res) => {
  try {
    await BotInstance.findByIdAndDelete(req.params.id);
    res.json({ message: 'Bot Instance deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getInstanceById,
  getAllInstances,
  createInstance,
  updateInstance,
  deleteInstance
};
