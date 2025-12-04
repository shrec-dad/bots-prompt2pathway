const SmsEvent = require("../models/smsEventModel");
const asyncHandler = require("express-async-handler");

// -------- Parsers -------------------------------------------------

function parseTwilioSms(body) {
  const status = body.SmsStatus || body.MessageStatus;
  const isStatusOnly = !!status && !body.Body;

  return {
    provider: "twilio",
    direction: isStatusOnly ? "status" : "inbound",
    eventType: isStatusOnly ? "status_update" : "inbound_message",
    messageId: body.MessageSid || body.SmsSid,
    from: body.From,
    to: body.To,
    status: status || (isStatusOnly ? undefined : "received"),
    errorCode: body.ErrorCode,
    text: body.Body || null,
    timestamp: new Date(), // Twilio doesn’t send timestamp by default
    rawData: body,
    metadata: {
      numMedia: body.NumMedia,
      apiVersion: body.ApiVersion,
      smsMessageSid: body.SmsMessageSid,
    },
  };
}

function parsePlivoSms(body) {
  // Inbound: From, To, Text
  // Delivery report: Status, MessageUUID
  const isStatus = !!body.Status && !body.Text;

  return {
    provider: "plivo",
    direction: isStatus ? "status" : "inbound",
    eventType: isStatus ? "delivery_report" : "inbound_message",
    messageId: body.MessageUUID || body.message_uuid || body.message_uuid || body.message_uuid,
    from: body.From || body.from_number,
    to: body.To || body.to_number,
    status: body.Status || (isStatus ? undefined : "received"),
    errorCode: body.ErrorCode || body.error_code,
    text: body.Text || null,
    timestamp: new Date(body.Timestamp || body.timestamp || Date.now()),
    rawData: body,
    metadata: {
      carrier: body.Carrier,
      units: body.Units,
      price: body.TotalAmount,
    },
  };
}

function parseMessageBirdSms(body) {
  // MessageBird inbound example: body.originator, body.recipients[0].recipient, body.body
  // Status webhooks: body.id, body.status
  const isStatus = !!body.status && !body.body;

  const recipient =
    Array.isArray(body.recipients) && body.recipients.length
      ? body.recipients[0]
      : {};

  return {
    provider: "messagebird",
    direction: isStatus ? "status" : "inbound",
    eventType: isStatus ? "delivery_report" : "inbound_message",
    messageId: body.id || recipient.id,
    from: body.originator || recipient.originator,
    to: String(recipient.recipient || body.recipient || ""),
    status: body.status || recipient.status || (isStatus ? undefined : "received"),
    errorCode: body.errors?.[0]?.code,
    text: body.body || null,
    timestamp: new Date(body.createdDatetime || body.statusDatetime || Date.now()),
    rawData: body,
    metadata: {
      type: body.type,
      href: body.href,
      reference: body.reference,
      gateway: recipient.gateway,
    },
  };
}

// -------- Handlers ------------------------------------------------

const handleTwilioSmsWebhook = asyncHandler(async (req, res) => {
  const parsed = parseTwilioSms(req.body);

  await SmsEvent.create(parsed);

  // Twilio only requires a 2xx; plain text is fine
  res.type("text/plain").send("OK");
});

const handlePlivoSmsWebhook = asyncHandler(async (req, res) => {
  const parsed = parsePlivoSms(req.body);

  await SmsEvent.create(parsed);

  res.status(200).json({ success: true });
});

const handleMessageBirdSmsWebhook = asyncHandler(async (req, res) => {
  const parsed = parseMessageBirdSms(req.body);

  await SmsEvent.create(parsed);

  res.status(200).json({ success: true });
});

// Generic / auto-detect
const handleGenericSmsWebhook = asyncHandler(async (req, res) => {
  const b = req.body || {};
  let parsed = null;

  if (b.MessageSid || b.SmsSid || b.From && b.To) {
    parsed = parseTwilioSms(b);
  } else if (b.MessageUUID || b.From && b.To && b.Text) {
    parsed = parsePlivoSms(b);
  } else if (b.originator || b.recipients) {
    parsed = parseMessageBirdSms(b);
  }

  if (parsed) {
    await SmsEvent.create(parsed);
    res.status(200).json({ success: true, provider: parsed.provider });
  } else {
    res.status(200).json({ success: true, message: "SMS webhook received (unrecognized format)" });
  }
});

// Query events (for your admin UI / analytics)
const getSmsEvents = asyncHandler(async (req, res) => {
  const {
    provider,
    eventType,
    from,
    to,
    messageId,
    instanceId,
    recipientId,
    limit = 50,
    skip = 0,
  } = req.query;

  const query = {};
  if (provider) query.provider = provider;
  if (eventType) query.eventType = eventType;
  if (from) query.from = from;
  if (to) query.to = to;
  if (messageId) query.messageId = messageId;
  if (instanceId) query.instanceId = instanceId;
  if (recipientId) query.recipientId = recipientId;

  const events = await SmsEvent.find(query)
    .sort({ timestamp: -1 })
    .limit(parseInt(limit, 10))
    .skip(parseInt(skip, 10))
    .populate("instanceId", "name botId")
    .populate("recipientId", "email phone name");

  const total = await SmsEvent.countDocuments(query);

  res.json({
    success: true,
    data: events,
    total,
    limit: parseInt(limit, 10),
    skip: parseInt(skip, 10),
  });
});

// Basic stats
const getSmsEventStats = asyncHandler(async (req, res) => {
  const { provider, instanceId, recipientId, startDate, endDate } = req.query;

  const match = {};
  if (provider) match.provider = provider;
  if (instanceId) match.instanceId = instanceId;
  if (recipientId) match.recipientId = recipientId;
  if (startDate || endDate) {
    match.timestamp = {};
    if (startDate) match.timestamp.$gte = new Date(startDate);
    if (endDate) match.timestamp.$lte = new Date(endDate);
  }

  const stats = await SmsEvent.aggregate([
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
  handleTwilioSmsWebhook,
  handlePlivoSmsWebhook,
  handleMessageBirdSmsWebhook,
  handleGenericSmsWebhook,
  getSmsEvents,
  getSmsEventStats,
};