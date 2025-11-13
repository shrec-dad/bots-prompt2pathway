const { saveSession } = require("./sessionStore");

async function advanceReceptionistFlow(sess, input) {
  const step = sess.step || "welcome";

  if (step === "welcome") {
    sess.step = "ask_name";
    await saveSession(sess);
    return {
      say: "Thanks for calling. Please say or enter your name after the beep.",
      gather: { nextStep: "collect_name", input: "both" },
    };
  }

  if (step === "collect_name") {
    sess.data = sess.data || {};
    sess.data.name = input?.transcript || input?.digits || "Caller";
    sess.step = "ask_reason";
    await saveSession(sess);
    return {
      say: `Hi ${sess.data.name}. Briefly tell me the reason for your call after the beep.`,
      gather: { nextStep: "collect_reason", input: "speech" },
    };
  }

  if (step === "collect_reason") {
    sess.data = sess.data || {};
    sess.data.reason = input?.transcript || input?.digits || "General inquiry";
    sess.step = "confirm";
    await saveSession(sess);
    return {
      say: "Thanks. I will notify the team now. Someone will follow up shortly. Goodbye.",
      hangup: true,
    };
  }

  // fallback
  sess.step = "welcome";
  await saveSession(sess);
  return {
    say: "Welcome. Please wait while I connect you.",
    gather: { nextStep: "collect_name", input: "both" },
  };
}

module.exports = {
  advanceReceptionistFlow,
};