const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");

/**
 * Widget endpoint that serves a standalone HTML page with the chat widget
 * Query parameters:
 * - bot: bot ID (or use inst for instance ID)
 * - inst: instance ID (overrides bot if provided)
 * - mode: popup | inline | sidebar
 * - position: bottom-right | bottom-left (or use 'pos' as alias)
 * - size: number (bubble size in px)
 * - shape: circle | rounded | square | oval | speech | speech-rounded
 * - imageFit: cover | contain
 * - panelStyle: step-by-step | conversation
 * - label: string (bubble label text)
 * - labelColor: hex color
 * - bgColor: hex color (bubble background)
 * - borderColor: hex color
 * - img: image URL or data URI (bubble image)
 * - botAvatar: image URL or data URI (bot avatar)
 */
router.get("/widget", (req, res) => {
  const apiBaseUrl = req.protocol + "://" + req.get("host") + "/api";

  // Parse query parameters
  const params = {
    botId: req.query.bot || req.query.inst || "",
    kind: req.query.inst ? "inst" : "bot",
    mode: req.query.mode || "popup",
    position: req.query.position || req.query.pos || "bottom-right",
    size: parseInt(req.query.size || "64", 10),
    shape: req.query.shape || "circle",
    imageFit: req.query.imageFit || "cover",
    panelStyle: req.query.panelStyle || "step-by-step",
    label: req.query.label || "Chat",
    labelColor: req.query.labelColor || "#ffffff",
    bgColor: req.query.bgColor || "#7aa8ff",
    borderColor: req.query.borderColor || "#000000",
    img: req.query.img || "",
    botAvatar: req.query.botAvatar || "",
  };

  // Read the HTML template
  const templatePath = path.join(__dirname, "../templates/widget.html");
  
  fs.readFile(templatePath, "utf8", (err, html) => {
    if (err) {
      console.error("Error reading widget template:", err);
      console.error("Template path attempted:", templatePath);
      return res.status(500).send("Error loading widget template: " + err.message);
    }

    // Escape JavaScript strings
    const escapeJs = (str) => {
      if (!str) return "";
      return String(str)
        .replace(/\\/g, "\\\\")
        .replace(/'/g, "\\'")
        .replace(/"/g, '\\"')
        .replace(/\n/g, "\\n")
        .replace(/\r/g, "\\r");
    };

    // Inject parameters and API URL into the HTML (with proper escaping)
    const renderedHtml = html
      .replace(/\{\{API_BASE_URL\}\}/g, escapeJs(apiBaseUrl))
      .replace(/\{\{BOT_ID\}\}/g, escapeJs(params.botId))
      .replace(/\{\{KIND\}\}/g, escapeJs(params.kind))
      .replace(/\{\{MODE\}\}/g, escapeJs(params.mode))
      .replace(/\{\{POSITION\}\}/g, escapeJs(params.position))
      .replace(/\{\{SIZE\}\}/g, params.size)
      .replace(/\{\{SHAPE\}\}/g, escapeJs(params.shape))
      .replace(/\{\{IMAGE_FIT\}\}/g, escapeJs(params.imageFit))
      .replace(/\{\{PANEL_STYLE\}\}/g, escapeJs(params.panelStyle))
      .replace(/\{\{LABEL\}\}/g, escapeJs(params.label))
      .replace(/\{\{LABEL_COLOR\}\}/g, escapeJs(params.labelColor))
      .replace(/\{\{BG_COLOR\}\}/g, escapeJs(params.bgColor))
      .replace(/\{\{BORDER_COLOR\}\}/g, escapeJs(params.borderColor))
      .replace(/\{\{IMG\}\}/g, escapeJs(params.img))
      .replace(/\{\{BOT_AVATAR\}\}/g, escapeJs(params.botAvatar));

    // Set headers for iframe embedding
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(renderedHtml);
  });
});

module.exports = router;

