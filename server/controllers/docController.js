const Doc = require('../models/docModel');
const cloudinary = require("../config/cloudinary");

const getDocsByBot = async (req, res) => {
  try {
    const docs = await Doc.find({ botId: req.params.id});
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

const createDoc = async (req, res) => {
  try {
    const { botId, botModelType, name, size} = { ...req.body};

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    if (!botId || !botModelType) {
      return res.status(400).json({ message: "Bot id and bot type are required" });
    }

    const newDoc = new Doc({
      botId,
      botModelType,
      name: name || req.file.originalname,
      size: size,
      url: req.file.path
    });
    const savedDoc = await newDoc.save();
    res.status(201).json(savedDoc);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const deleteDoc = async (req, res) => {
  try {
    const doc = await Doc.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ error: "Document not found" });
    }

    const matches = doc.url.match(/\/upload\/(?:v\d+\/)?([^?#]+)$/);
    const publicId = matches ? matches[1] : null;

    if (!publicId) {
      return res.status(400).json({ error: "Could not extract Cloudinary public_id" });
    }

    await cloudinary.uploader.destroy(publicId, { resource_type: "raw" });
    await doc.deleteOne();

    res.json({ message: "Document deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getDocsByBot,
  createDoc,
  deleteDoc
};