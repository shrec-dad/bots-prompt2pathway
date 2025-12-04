const asyncHandler = require("express-async-handler");
const CrmEvent = require("../models/crmEventModel");

// -------- Helpers -------------------------------------------------

function normalizeToArray(body) {
  if (Array.isArray(body)) return body;
  if (body && Array.isArray(body.events)) return body.events;
  if (body && Array.isArray(body.data)) return body.data;
  return [body];
}

function inferEventShape(event) {
  const e = event || {};

  // Provider-agnostic guesses
  const eventType =
    e.event ||
    e.eventType ||
    e.type ||
    e.action ||
    (e.change && e.change.type) ||
    (e.object && e.object.action) ||
    "unknown";

  const objectType =
    e.objectType ||
    e.object_type ||
    e.object ||
    (e.data && e.data.object) ||
    (e.payload && e.payload.object) ||
    "unknown";

  const objectId =
    e.objectId ||
    e.object_id ||
    e.id ||
    (e.data && e.data.id) ||
    (e.object && e.object.id) ||
    (e.payload && e.payload.id) ||
    null;

  const eventId =
    e.eventId ||
    e.event_id ||
    e.id ||
    e.uuid ||
    (e.meta && (e.meta.eventId || e.meta.id)) ||
    null;

  const timestampRaw =
    e.timestamp ||
    e.occurred_at ||
    e.created_at ||
    e.eventTime ||
    e.time ||
    (e.meta && (e.meta.timestamp || e.meta.occurred_at)) ||
    Date.now();

  const timestamp = new Date(timestampRaw);

  return {
    eventType,
    objectType,
    objectId,
    eventId,
    timestamp: isNaN(timestamp.getTime()) ? new Date() : timestamp,
  };
}

// -------- Handlers ------------------------------------------------

// Generic CRM webhook receiver, NOT locked to a single provider.
// Example endpoints:
//   POST /api/webhooks/crm/hubspot
//   POST /api/webhooks/crm/salesforce
//   POST /api/webhooks/crm/pipedrive
//   POST /api/webhooks/crm        (provider falls back to "unknown" or header hint)
const handleCrmWebhook = asyncHandler(async (req, res) => {
  const providerFromPath = req.params.provider;
  const providerFromHeader =
    req.get("x-crm-provider") ||
    req.get("x-provider") ||
    req.get("x-hubspot-signature-version") && "hubspot" ||
    null;

  const provider =
    (providerFromPath && providerFromPath.toLowerCase()) ||
    (providerFromHeader && String(providerFromHeader).toLowerCase()) ||
    "unknown";

  const events = normalizeToArray(req.body || {});

  const docs = events.map((raw) => {
    const shape = inferEventShape(raw);

    return new CrmEvent({
      provider,
      eventType: shape.eventType,
      objectType: shape.objectType,
      objectId: shape.objectId,
      eventId: shape.eventId,
      timestamp: shape.timestamp,
      rawData: raw,
      metadata: {
        query: req.query,
        headers: {
          "user-agent": req.get("user-agent"),
          "x-forwarded-for": req.get("x-forwarded-for"),
        },
      },
    });
  });

  if (!docs.length) {
    return res.status(200).json({ success: true, message: "No events to record" });
  }

  await CrmEvent.insertMany(docs, { ordered: false });

  res.status(200).json({
    success: true,
    provider,
    processed: docs.length,
  });
});

// Admin: list CRM webhook events with filters / pagination
const getCrmEvents = asyncHandler(async (req, res) => {
  const {
    provider,
    eventType,
    objectType,
    objectId,
    eventId,
    instanceId,
    recipientId,
    limit = 50,
    skip = 0,
  } = req.query;

  const query = {};
  if (provider) query.provider = provider;
  if (eventType) query.eventType = eventType;
  if (objectType) query.objectType = objectType;
  if (objectId) query.objectId = objectId;
  if (eventId) query.eventId = eventId;
  if (instanceId) query.instanceId = instanceId;
  if (recipientId) query.recipientId = recipientId;

  const events = await CrmEvent.find(query)
    .sort({ timestamp: -1 })
    .limit(parseInt(limit, 10))
    .skip(parseInt(skip, 10))
    .populate("instanceId", "name botId")
    .populate("recipientId", "email phone name");

  const total = await CrmEvent.countDocuments(query);

  res.json({
    success: true,
    data: events,
    total,
    limit: parseInt(limit, 10),
    skip: parseInt(skip, 10),
  });
});

// Admin: basic stats grouped by eventType (and aggregated providers)
const getCrmEventStats = asyncHandler(async (req, res) => {
  const { provider, objectType, instanceId, recipientId, startDate, endDate } = req.query;

  const match = {};
  if (provider) match.provider = provider;
  if (objectType) match.objectType = objectType;
  if (instanceId) match.instanceId = instanceId;
  if (recipientId) match.recipientId = recipientId;
  if (startDate || endDate) {
    match.timestamp = {};
    if (startDate) match.timestamp.$gte = new Date(startDate);
    if (endDate) match.timestamp.$lte = new Date(endDate);
  }

  const stats = await CrmEvent.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$eventType",
        count: { $sum: 1 },
        providers: { $addToSet: "$provider" },
      },
    },
    { $sort: { count: -1 } },
  ]);

  res.json({ success: true, data: stats });
});

module.exports = {
  handleCrmWebhook,
  getCrmEvents,
  getCrmEventStats,
};


