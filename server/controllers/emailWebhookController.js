const EmailEvent = require("../models/emailEventModel");
const asyncHandler = require("express-async-handler");
const crypto = require("crypto");

function verifySendGridSignature(rawBody, signature, publicKey) {
  if (!publicKey) return true;
  try {
    return crypto.createVerify("sha256").update(rawBody).verify(publicKey, signature, "base64");
  } catch (error) {
    return false;
  }
}

function verifyPostmarkSignature(rawBody, signature, secret) {
  if (!secret) return true;
  const expectedSignature = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
}

function verifyMailgunSignature(timestamp, token, signature, signingKey) {
  if (!signingKey) return true;
  const encodedToken = crypto.createHmac("sha256", signingKey).update(timestamp.concat(token)).digest("hex");
  return encodedToken === signature;
}

function parseSendGridEvent(event) {
  return {
    provider: "sendgrid",
    eventType: event.event,
    messageId: event.sg_message_id || event["smtp-id"] || event.message_id,
    email: event.email,
    timestamp: new Date(event.timestamp * 1000 || event.time || Date.now()),
    rawData: event,
    metadata: {
      reason: event.reason,
      status: event.status,
      url: event.url,
      userAgent: event.useragent,
      ip: event.ip,
      category: event.category,
      asmGroupId: event.asm_group_id,
    },
  };
}

function parsePostmarkEvent(event) {
  return {
    provider: "postmark",
    eventType: event.RecordType,
    messageId: event.MessageID,
    email: event.Recipient || event.Email,
    timestamp: new Date(event.DeliveredAt || event.BouncedAt || event.OpenedAt || event.ClickedAt || Date.now()),
    rawData: event,
    metadata: {
      serverId: event.ServerID,
      description: event.Description,
      details: event.Details,
      link: event.Link,
      userAgent: event.UserAgent,
      ip: event.OriginalLink,
    },
  };
}

function parseMailgunEvent(event) {
  return {
    provider: "mailgun",
    eventType: event.event,
    messageId: event["message-id"] || event.messageId,
    email: event.recipient || event["user-variables"]?.email,
    timestamp: new Date(event.timestamp || Date.now()),
    rawData: event,
    metadata: {
      reason: event.reason,
      code: event.code,
      description: event.description,
      url: event.url,
      userAgent: event["user-agent"],
      ip: event.ip,
      severity: event.severity,
    },
  };
}

const handleSendGridWebhook = asyncHandler(async (req, res) => {
  const signature = req.get("X-Twilio-Email-Webhook-Signature");
  const publicKey = process.env.SENDGRID_WEBHOOK_PUBLIC_KEY;

  if (publicKey && signature) {
    const isValid = verifySendGridSignature(req.rawBody, signature, publicKey);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid signature" });
    }
  }

  const events = Array.isArray(req.body) ? req.body : [req.body];

  const emailEvents = events.map((event) => {
    const parsed = parseSendGridEvent(event);
    return new EmailEvent(parsed);
  });

  await EmailEvent.insertMany(emailEvents, { ordered: false });

  res.status(200).json({ success: true, processed: emailEvents.length });
});

const handlePostmarkWebhook = asyncHandler(async (req, res) => {
  const signature = req.get("X-Postmark-Signature");
  const secret = process.env.POSTMARK_WEBHOOK_SECRET;

  if (secret && signature) {
    const isValid = verifyPostmarkSignature(req.rawBody, signature, secret);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid signature" });
    }
  }

  const event = req.body;
  const parsed = parsePostmarkEvent(event);

  await EmailEvent.create(parsed);

  res.status(200).json({ success: true });
});

const handleMailgunWebhook = asyncHandler(async (req, res) => {
  const signature = req.body.signature;
  const timestamp = req.body.timestamp;
  const token = req.body.token;
  const signingKey = process.env.MAILGUN_WEBHOOK_SIGNING_KEY;

  if (signingKey && signature && timestamp && token) {
    const isValid = verifyMailgunSignature(timestamp, token, signature, signingKey);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid signature" });
    }
  }

  const parsed = parseMailgunEvent(req.body);

  await EmailEvent.create(parsed);

  res.status(200).json({ success: true });
});

const handleGenericWebhook = asyncHandler(async (req, res) => {
  console.log("Generic webhook received:", {
    headers: req.headers,
    body: req.body,
    query: req.query,
  });

  let provider = "unknown";
  let parsed = null;

  if (req.headers["x-postmark-signature"]) {
    provider = "postmark";
    parsed = parsePostmarkEvent(req.body);
  } else if (req.headers["x-twilio-email-webhook-signature"] || req.body.event) {
    provider = "sendgrid";
    parsed = parseSendGridEvent(req.body);
  } else if (req.body.signature || req.body.event) {
    provider = "mailgun";
    parsed = parseMailgunEvent(req.body);
  }

  if (parsed) {
    await EmailEvent.create(parsed);
    res.status(200).json({ success: true, provider, message: "Event processed" });
  } else {
    res.status(200).json({ success: true, message: "Webhook received but not processed" });
  }
});

const getEmailEvents = asyncHandler(async (req, res) => {
  const { provider, eventType, email, messageId, instanceId, recipientId, limit = 50, skip = 0 } = req.query;

  const query = {};
  if (provider) query.provider = provider;
  if (eventType) query.eventType = eventType;
  if (email) query.email = email;
  if (messageId) query.messageId = messageId;
  if (instanceId) query.instanceId = instanceId;
  if (recipientId) query.recipientId = recipientId;

  const events = await EmailEvent.find(query)
    .sort({ timestamp: -1 })
    .limit(parseInt(limit))
    .skip(parseInt(skip))
    .populate("instanceId", "name botId")
    .populate("recipientId", "email name");

  const total = await EmailEvent.countDocuments(query);

  res.json({
    success: true,
    data: events,
    total,
    limit: parseInt(limit),
    skip: parseInt(skip),
  });
});

const getEmailEventStats = asyncHandler(async (req, res) => {
  const { provider, instanceId, recipientId, startDate, endDate } = req.query;

  const matchQuery = {};
  if (provider) matchQuery.provider = provider;
  if (instanceId) matchQuery.instanceId = instanceId;
  if (recipientId) matchQuery.recipientId = recipientId;
  if (startDate || endDate) {
    matchQuery.timestamp = {};
    if (startDate) matchQuery.timestamp.$gte = new Date(startDate);
    if (endDate) matchQuery.timestamp.$lte = new Date(endDate);
  }

  const stats = await EmailEvent.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: "$eventType",
        count: { $sum: 1 },
        providers: { $addToSet: "$provider" },
      },
    },
    { $sort: { count: -1 } },
  ]);

  res.json({
    success: true,
    data: stats,
  });
});

module.exports = {
  handleSendGridWebhook,
  handlePostmarkWebhook,
  handleMailgunWebhook,
  handleGenericWebhook,
  getEmailEvents,
  getEmailEventStats,
};

