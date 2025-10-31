const Recipient = require('../models/recipientModel');

// List all recipients
const getAllRecipients = async (req, res) => {
  try {
    const { instId } = req.params;
    const recipients = await Recipient.find({ instanceId: instId });
    res.json(recipients);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create new recipients
const createRecipients = async (req, res) => {
  try {
    const { instId } = req.params;
    const { recipients } = req.body;

    if (!Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ error: "Recipients array is required." });
    }

    const recipientsWithInstance = recipients.map(r => ({
      ...r,
      instanceId: instId,
    }));

    // Use insertMany for batch creation
    const savedRecipients = await Recipient.insertMany(recipientsWithInstance);

    res.status(201).json(savedRecipients);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const deleteRecipients = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "Recipient IDs array is required" });
    }

    const result = await Recipient.deleteMany({ _id: { $in: ids } });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "No recipients found to delete" });
    }

    return res.json({
      message: `${result.deletedCount} recipient(s) deleted successfully`,
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getAllRecipients,
  createRecipients,
  deleteRecipients
};