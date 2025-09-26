// src/pages/EmbedPage.tsx
import React, { useMemo, useRef } from "react";
import "../styles/admin-shared.css";
import { getJSON } from "../lib/storage";

type Branding = {
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
  logoDataUrl?: string | null;
  chatBubbleImage?: string | null;
  chatBubbleColor?: string;
  chatBubbleSize?: number;
  chatBubblePosition?: "bottom-right" | "bottom-left";
};

const BRAND_KEY = "brandingSettings";

export default function EmbedPage() {
  const branding = useMemo<Branding>(() => getJSON<Branding>(BRAND_KEY, {}), []);
  const preRef = useRef<HTMLTextAreaElement>(null);

  const options = {
    mode: "basic",
    language: "en",
    whitelist: [],
    ui: {
      font: branding.fontFamily || "Arial, sans-serif",
      logoDataUrl: branding.logoDataUrl ?? null,
      bubble: {
        image: branding.chatBubbleImage ?? null,
        color: branding.chatBubbleColor || "#7aa8ff",
        size: branding.chatBubbleSize || 64,
        position: branding.chatBubblePosition || "bottom-right",
      },
    },
  };

  const snippet = `<script src="https://cdn.example.com/mybot-widget.js" async></script>
<script>
(function () {
  var mount = function () {
    if (window.MyBotWidget && window.MyBotWidget.mount) {
      window.MyBotWidget.mount({
        options: JSON.parse(decodeURIComponent("${encodeURIComponent(JSON.stringify(options))}"))
      });
    } else {
      console.warn("MyBotWidget not available yet.");
    }
  };
  if (document.readyState === "complete") mount();
  else window.addEventListener("load", mount);
})();
</script>`.trim();

  const copy = async () => {
    if (!preRef.current) return;
    try {
      await navigator.clipboard.writeText(preRef.current.value);
      preRef.current.select();
    } catch {
      // Fallback: select text for manual copy
      preRef.current.select();
    }
  };

  return (
    <div className="admin-page">
      <div className="h-row">
        <div className="h-title">Embed</div>
        <div className="stack" style={{ gridTemplateColumns: "auto auto" }}>
          <button className="btn primary" onClick={copy}>Copy</button>
        </div>
      </div>

      <div className="admin-section">
        <div className="rounded-2xl border p-4 bg-white ring-1 ring-border
                        bg-gradient-to-r from-emerald-200/60 via-sky-200/60 to-indigo-200/60">
          <div className="rounded-xl border bg-white">
            <div className="p-4">
              <div className="h-title !text-lg !mb-3">Embed Code (copy & paste)</div>
              <textarea
                ref={preRef}
                className="w-full h-[360px] font-mono text-sm rounded-lg border bg-card p-3 leading-5"
                readOnly
                value={snippet}
              />
              <div className="mt-3">
                <button className="btn primary" onClick={copy} aria-label="Copy embed code">
                  Copy
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
