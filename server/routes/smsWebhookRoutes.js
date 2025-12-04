const express = require("express");
const router = express.Router();
const {
  handleTwilioSmsWebhook,
  handlePlivoSmsWebhook,
  handleMessageBirdSmsWebhook,
  handleGenericSmsWebhook,
  getSmsEvents,
  getSmsEventStats,
} = require("../controllers/smsWebhookController");
const { authenticate } = require("../middleware/auth");

// Provider-specific webhooks (no auth, providers validate by secret / IP)
router.post("/twilio", handleTwilioSmsWebhook);
router.post("/plivo", handlePlivoSmsWebhook);
router.post("/messagebird", handleMessageBirdSmsWebhook);
router.post("/generic", handleGenericSmsWebhook);

// Admin / analytics (requires JWT)
router.get("/events", authenticate, getSmsEvents);
router.get("/stats", authenticate, getSmsEventStats);

module.exports = router;