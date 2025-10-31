const express = require('express');
const router = express.Router();
const controller = require('../controllers/recipientController');
const { authenticate, authorize } = require("../middleware/auth.js");

// GET all recipients
router.get('/:instId', controller.getAllRecipients);

// POST create new recipients
router.post('/:instId', controller.createRecipients);

// POST delete recipients
router.post('/', controller.deleteRecipients);

module.exports = router;