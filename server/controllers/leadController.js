const Lead = require('../models/leadModel');

const createLead = async (req, res) => {
  try {
    const leadData = {
      ...req.body,
      capturedAt: new Date(),
    };

    // Determine capture level based on available data
    const hasEmail = leadData.email && leadData.email.trim() !== '';
    const hasPhone = leadData.phone && leadData.phone.trim() !== '';
    const hasName = leadData.name && leadData.name.trim() !== '';
    
    // Full capture: has both email and phone, or email/phone + name
    if ((hasEmail && hasPhone) || (hasEmail && hasName) || (hasPhone && hasName)) {
      leadData.captureLevel = 'full';
    } else {
      leadData.captureLevel = 'partial';
    }

    // Set status to 'new' if not provided
    if (!leadData.status) {
      leadData.status = 'new';
    }

    const newLead = new Lead(leadData);
    const savedLead = await newLead.save();
    
    res.status(201).json(savedLead);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const getLeads = async (req, res) => {
  try {
    const { botInstanceId, status, limit = 100, skip = 0 } = req.query;
    
    const query = {};
    if (botInstanceId) query.botInstanceId = botInstanceId;
    if (status) query.status = status;

    const leads = await Lead.find(query)
      .sort({ capturedAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .populate('botInstanceId', 'name botKey');
    
    const total = await Lead.countDocuments(query);
    
    res.json({ leads, total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getLeadById = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id).populate('botInstanceId', 'name botKey');
    if (!lead) return res.status(404).json({ error: 'Lead not found' });
    res.json(lead);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateLead = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    Object.keys(req.body).forEach((key) => {
      if (req.body[key] !== undefined) {
        lead[key] = req.body[key];
      }
    });

    const updatedLead = await lead.save();
    res.json(updatedLead);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const deleteLead = async (req, res) => {
  try {
    await Lead.findByIdAndDelete(req.params.id);
    res.json({ message: 'Lead deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createLead,
  getLeads,
  getLeadById,
  updateLead,
  deleteLead,
};
