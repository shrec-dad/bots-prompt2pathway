// src/components/EmbedGenerator.tsx
import React, { useMemo } from "react";
import "../styles/admin-shared.css";
import { getJSON } from "../lib/storage";

type Branding = {
  logoDataUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
  chatBubbleImage?: string;
  chatBubbleColor?: string;
  chatBubbleSize?: number;
  chatBubblePosition?: "bottom-right" | "bottom-left";
};

type Settings = {
  mode?: "basic" | "custom";
  language?: "en" | "es";
  domainWhitelist?: string; // comma-separated
};

const BRANDING_KEY = "brandingSettings";
const SETTINGS_KEY = "globalSettings";

export default function EmbedGenerator() {
  const branding = useMemo<Branding>(() => getJSON(BRANDING_KEY, {}), []);
  const settings = useMemo<Settings>(() => getJSON(SETTINGS_KEY, {}), []);

  const options = {
    mode: settings.mode ?? "basic",
    language: settings.language ?? "en",
    whitelist: (settings.domainWhitelist ?? "").split(",").map(s => s.trim()).filter(Boolean),
    ui: {
      font: branding.fontFamily ?? "Inter, system-ui, Arial, sans-serif",
      logoDataUrl: branding.logoDataUrl ?? null,
      bubble: {
        image: branding.chatBubbleImage ?? null,
        color: branding.chatBubbleColor ?? "#7aa8ff",
        size: branding.chatBubbleSize ?? 64,
        position: branding.chatBubblePosition ?? "bottom-right",
      },
      colors: {
        primary: branding.primaryColor ?? "#7aa8ff",
        secondary: branding.secondaryColor ?? "#76c19a",
      },
    },
  };

  const json = encodeURIComponent(JSON.stringify(options, null, 2));

  const snippet = `<script src="https://cdn.example.com/mybot-widget.js" async></script>
<script>
  (function () {
    var mount = function () {
      if (window.MyBotWidget && window.MyBotWidget.mount) {
        window.MyBotWidget.mount({
          options: JSON.parse(decodeURI("${json}"))
        });
      } else {
        console.warn("MyBotWidget not available yet.");
      }
    };
    if (document.readyState === "complete") mount();
    else window.addEventListener("load", mount);
  })();
</script>`;

  return (
    <div className="admin-section">
      <div className="h-title">Embed</div>

      <div className="card code-scroller">
        {/* NOTE: pre-wrap + break-all ensures long lines wrap instead of running off-screen */}
        <pre className="code-pre">{snippet}</pre>
      </div>
    </div>
  );
}
