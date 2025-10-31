const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const { authenticate, authorize } = require("../middleware/auth.js");

// GET all clients
router.get('/', clientController.getAllClients);

// POST create new client
router.post('/', clientController.createClient);

// PUT update client by ID
router.put('/:id', clientController.updateClient);

// DELETE delete client by ID
router.delete('/:id', clientController.deleteClient);

module.exports = router;