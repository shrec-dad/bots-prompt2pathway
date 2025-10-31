const Settings = require('../models/settingsModel');

const getSettingsByKey = async (req, res) => {
  try {
    let settings = await Settings.findOne({ key: req.params.key });
    if (!settings) {
			settings = await Settings.create({ key: req.params.key });
		}
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateSettingsByKey = async (req, res) => {
  try {
    if (req.body.defaultBot === "") {
      req.body.defaultBot = null;
    }
    
    const settings = await Settings.findOneAndUpdate(
      { key: req.params.key },
      { $set: req.body },
      { new: true, upsert: true }
    );

    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
	getSettingsByKey,
	updateSettingsByKey
}
