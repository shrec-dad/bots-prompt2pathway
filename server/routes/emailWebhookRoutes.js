const express = require("express");
const router = express.Router();
const {
  handleSendGridWebhook,
  handlePostmarkWebhook,
  handleMailgunWebhook,
  handleGenericWebhook,
  getEmailEvents,
  getEmailEventStats,
} = require("../controllers/emailWebhookController");
const { authenticate } = require("../middleware/auth");

// Webhook endpoints (no auth required - verified by signature)
router.post("/sendgrid", handleSendGridWebhook);
router.post("/postmark", handlePostmarkWebhook);
router.post("/mailgun", handleMailgunWebhook);
router.post("/generic", handleGenericWebhook);

// Admin endpoints (auth required)
router.get("/events", authenticate, getEmailEvents);
router.get("/stats", authenticate, getEmailEventStats);

module.exports = router;

