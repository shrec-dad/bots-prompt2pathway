const express = require("express");
const { loadSession, saveSession, clearSession } = require("./sessionStore");
const { advanceReceptionistFlow } = require("./receptionistEngine");
const { serialize } = require("./providers");

const router = express.Router();

/** Utility: decide output format (json|twilio|plivo|sinch) */
function providerMode(req) {
  return req.query.provider || process.env.DEFAULT_PROVIDER_MODE || "json";
}

/** Normalize any incoming webhook to CanonicalIn */
function normalize(req) {
  const b = { ...req.body, ...req.query };
  const callId = b.callId || b.CallSid || b.CallUUID || b.call_id || b.call_uuid;
  return {
    callId,
    from: b.From || b.from,
    to: b.To || b.to,
    instanceId: b.instanceId || b.inst || b.bot || undefined,
    digits: b.Digits || b.digits,
    transcript: b.SpeechResult || b.transcript,
    event: b.event || "incoming",
  };
}

/**
 * POST /telephony/incoming
 * Universal entrypoint for a new (or resumed) call.
 * Accepts JSON or form-encoded. Returns JSON by default,
 * or TwiML/Plivo XML if ?provider=twilio|plivo is set.
 */
router.post("/incoming", async (req, res) => {
  const mode = providerMode(req);
  const ev = normalize(req);
  if (!ev.callId) return res.status(400).send("callId required");

  let sess = await loadSession(ev.callId);
  if (!sess) {
    sess = {
      callId: ev.callId,
      instanceId: ev.instanceId,
      step: "welcome",
      data: { from: ev.from, to: ev.to },
    };
    await saveSession(sess);
  }

  const engineOut = await advanceReceptionistFlow(sess);
  const canonical = engineOut.hangup
    ? { action: "hangup", text: engineOut.say }
    : {
        action: "say",
        text: engineOut.say,
        gather: engineOut.gather
          ? { input: engineOut.gather.input || "speech", maxDigits: engineOut.gather.maxDigits }
          : undefined,
      };

  const { contentType, body } = serialize(mode, canonical);
  res.setHeader("Content-Type", contentType);
  res.send(body);
});

/**
 * POST /telephony/gather
 * Provider will POST the user's input (dtmf/speech) with the same callId.
 */
router.post("/gather", async (req, res) => {
  const mode = providerMode(req);
  const ev = normalize(req);
  if (!ev.callId) return res.status(400).send("callId required");

  const sess = (await loadSession(ev.callId)) || { callId: ev.callId, step: "welcome" };
  // continue to next step using received input
  const engineOut = await advanceReceptionistFlow(sess, {
    digits: ev.digits,
    transcript: ev.transcript,
  });

  const canonical = engineOut.hangup
    ? { action: "hangup", text: engineOut.say }
    : {
        action: "say",
        text: engineOut.say,
        gather: engineOut.gather
          ? { input: engineOut.gather.input || "speech", maxDigits: engineOut.gather.maxDigits }
          : undefined,
      };

  const { contentType, body } = serialize(mode, canonical);
  res.setHeader("Content-Type", contentType);
  res.send(body);
});

/**
 * POST /telephony/hangup
 * Cleanup session when call ends.
 */
router.post("/hangup", async (req, res) => {
  const ev = normalize(req);
  if (ev.callId) await clearSession(ev.callId);
  res.json({ ok: true });
});

module.exports = router;
