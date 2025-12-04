const express = require("express");
const router = express.Router();

const {
  handleCrmWebhook,
  getCrmEvents,
  getCrmEventStats,
} = require("../controllers/crmWebhookController");

const { authenticate } = require("../middleware/auth");

// Generic CRM webhook receiver (no auth, rely on provider secrets / IP allowlisting)
// Examples:
//   POST /api/webhooks/crm/hubspot
//   POST /api/webhooks/crm/salesforce
//   POST /api/webhooks/crm/pipedrive
//   POST /api/webhooks/crm (provider inferred from headers or defaults to "unknown")
router.post("/:provider?", handleCrmWebhook);

// Admin / analytics endpoints (JWT required)
router.get("/events", authenticate, getCrmEvents);
router.get("/stats", authenticate, getCrmEventStats);

module.exports = router;


