function serialize(provider, out) {
  switch (provider) {
    case "twilio":
      // Very small TwiML subset; expand later as needed
      if (out.action === "hangup") {
        return {
          contentType: "text/xml",
          body:
            `<?xml version="1.0" encoding="UTF-8"?>` +
            `<Response>${out.text ? `<Say>${escapeXml(out.text)}</Say>` : ""}<Hangup/></Response>`,
        };
      }
      if (out.gather) {
        return {
          contentType: "text/xml",
          body:
            `<?xml version="1.0" encoding="UTF-8"?>` +
            `<Response><Gather input="${out.gather.input}" timeout="5"><Say>${escapeXml(
              out.text
            )}</Say></Gather></Response>`,
        };
      }
      return {
        contentType: "text/xml",
        body:
          `<?xml version="1.0" encoding="UTF-8"?>` +
          `<Response><Say>${escapeXml(out.text)}</Say></Response>`,
      };

    case "plivo":
      // Minimal Plivo XML; expand later
      if (out.action === "hangup") {
        return {
          contentType: "application/xml",
          body:
            `<Response>${out.text ? `<Speak>${escapeXml(out.text)}</Speak>` : ""}<Hangup/></Response>`,
        };
      }
      if (out.gather) {
        return {
          contentType: "application/xml",
          body:
            `<Response><GetInput inputType="${
              out.gather.input === "speech" ? "speech" : "dtmf"
            }"><Speak>${escapeXml(out.text)}</Speak></GetInput></Response>`,
        };
      }
      return {
        contentType: "application/xml",
        body: `<Response><Speak>${escapeXml(out.text)}</Speak></Response>`,
      };

    case "sinch":
      // Keep neutral JSON; Sinch can map via function later
      return { contentType: "application/json", body: JSON.stringify(out) };

    default:
      // Neutral JSON (recommended until provider is chosen)
      return { contentType: "application/json", body: JSON.stringify(out) };
  }
}

function escapeXml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

module.exports = {
  serialize,
};
