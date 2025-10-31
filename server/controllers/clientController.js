const Client = require('../models/clientModel');

// List all clients
const getAllClients = async (req, res) => {
  try {
    const clients = await Client.find();
    res.json(clients);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create a new client
const createClient = async (req, res) => {
  try {
    const clientData = req.body;

    const client = new Client(clientData);
    const savedClient = await client.save();

    res.status(201).json(savedClient);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update client by ID
const updateClient = async (req, res) => {
  try {
    const updatedClient = await Client.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedClient) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json(updatedClient);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const deleteClient = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedClient = await Client.findByIdAndDelete(id);
    if (!deletedClient) {
      return res.status(404).json({ message: "Client not found" });
    }

    return res.json({ message: "Client deleted successfully" });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getAllClients,
  createClient,
  updateClient,
  deleteClient
};