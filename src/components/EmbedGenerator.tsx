// src/components/EmbedGenerator.tsx
import React, { useMemo } from "react";

/**
 * Reads your saved settings:
 *  - Branding: localStorage["brandingSettings"] (from your Branding page)
 *  - App Settings: localStorage["appSettings"] (from your Settings page)
 * Then builds a copy-paste <script> embed.
 */

function safeParse<T>(raw: string | null, fallback: T): T {
  try {
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

type Branding = {
  logoDataUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  chatBubbleImage?: string;
  chatBubbleColor: string;
  chatBubbleSize: number; // px
  chatBubblePosition: "bottom-right" | "bottom-left";
};

type AppSettings = {
  basicOrCustom?: "basic" | "custom";
  domainWhitelist?: string; // comma separated
  darkMode?: boolean;
  language?: string;
};

const DEFAULT_BRANDING: Branding = {
  primaryColor: "#7aa8ff",
  secondaryColor: "#76c19a",
  fontFamily: "Inter, system-ui, Arial, sans-serif",
  chatBubbleColor: "#7aa8ff",
  chatBubbleSize: 64,
  chatBubblePosition: "bottom-right",
};

const DEFAULT_SETTINGS: AppSettings = {
  basicOrCustom: "basic",
  domainWhitelist: "example.com",
  darkMode: false,
  language: "en",
};

export default function EmbedGenerator() {
  const { snippet, prettyJson } = useMemo(() => {
    const branding = safeParse<Branding>(
      localStorage.getItem("brandingSettings"),
      DEFAULT_BRANDING
    );
    const settings = safeParse<AppSettings>(
      localStorage.getItem("appSettings"),
      DEFAULT_SETTINGS
    );

    // Options passed to your widget on mount
    const options = {
      mode: settings.basicOrCustom ?? "basic",
      language: settings.language ?? "en",
      whitelist: (settings.domainWhitelist || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      branding: {
        primaryColor: branding.primaryColor,
        secondaryColor: branding.secondaryColor,
        fontFamily: branding.fontFamily,
        logoDataUrl: branding.logoDataUrl || null,
        bubble: {
          image: branding.chatBubbleImage || null,
          color: branding.chatBubbleColor,
          size: branding.chatBubbleSize,
          position: branding.chatBubblePosition,
        },
      },
    };

    const jsonEncoded = encodeURIComponent(JSON.stringify(options));

    // NOTE: Replace the src with your real CDN when ready
    const snippet = `<script src="https://cdn.example.com/mybot-widget.js" async></script>
<script>
  (function () {
    var mount = function () {
      if (window.MyBotWidget && window.MyBotWidget.mount) {
        window.MyBotWidget.mount({ options: JSON.parse(decodeURIComponent("${jsonEncoded}")) });
      } else {
        console.warn("MyBotWidget not available yet.");
      }
    };
    if (document.readyState === "complete") mount();
    else window.addEventListener("load", mount);
  })();
</script>`;

    return { snippet, prettyJson: JSON.stringify(options, null, 2) };
  }, []);

  const copy = async () => {
    await navigator.clipboard.writeText(snippet);
    alert("Embed code copied!");
  };

  return (
    <div className="admin-section">
      <div className="card stack">
        <div className="h-title">Embed Code (copy & paste)</div>
        <pre style={{ whiteSpace: "pre-wrap", color: "black" }}>{snippet}</pre>
        <button className="btn outline" onClick={copy}>Copy to Clipboard</button>
      </div>

      <div className="card stack">
        <div className="h-title">Options Preview</div>
        <pre style={{ whiteSpace: "pre-wrap", color: "black" }}>{prettyJson}</pre>
      </div>
    </div>
  );
}

