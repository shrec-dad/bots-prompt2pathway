const { createClient } = require("redis");

const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";
const PREFIX = process.env.SESSION_PREFIX || "telephony:sess:";
const TTL = parseInt(process.env.SESSION_TTL_SECONDS || "7200", 10);

let client = null;

async function getRedis() {
  if (!client) {
    client = createClient({ url: REDIS_URL });
    client.on("error", (e) => console.error("Redis error", e));
    await client.connect();
  }
  return client;
}

const key = (callId) => `${PREFIX}${callId}`;

async function loadSession(callId) {
  const r = await getRedis();
  const raw = await r.get(key(callId));
  return raw ? JSON.parse(raw) : null;
}

async function saveSession(sess) {
  const r = await getRedis();
  const now = new Date().toISOString();
  const next = { ...sess, startedAt: sess.startedAt || now, updatedAt: now };
  await r.set(key(sess.callId), JSON.stringify(next), { EX: TTL });
}

async function clearSession(callId) {
  const r = await getRedis();
  await r.del(key(callId));
}

module.exports = {
  getRedis,
  loadSession,
  saveSession,
  clearSession,
};