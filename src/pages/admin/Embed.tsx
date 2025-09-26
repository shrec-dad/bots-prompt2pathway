// src/pages/admin/Embed.tsx
import React, { useMemo, useRef } from "react";
import "../../styles/admin-shared.css"; // <-- fixed relative path
import { getJSON } from "../../lib/storage";

const BRAND_KEY = "brandingSettings";

export default function Embed() {
  const branding = useMemo(
    () =>
      getJSON(BRAND_KEY, {
        primaryColor: "#7aa8ff",
        secondaryColor: "#76c19a",
        fontFamily: "Inter, system-ui, Arial, sans-serif",
        chatBubbleColor: "#7aa8ff",
        chatBubbleSize: 64,
        chatBubblePosition: "bottom-right",
      }),
    []
  );

  const options = {
    mode: "basic",
    language: "en",
    whitelist: "",
    ui: {
      fontFamily: branding.fontFamily,
      logoDataUrl: branding.logoDataUrl ?? null,
      bubble: {
        image: branding.chatBubbleImage ?? null,
        color: branding.chatBubbleColor,
        size: branding.chatBubbleSize,
        position: branding.chatBubblePosition,
      },
      colors: {
        primary: branding.primaryColor,
        secondary: branding.secondaryColor,
      },
    },
  };

  const code = `<script src="https://cdn.example.com/mybot-widget.js" async></script>
<script>
  (function () {
    var mount = function () {
      if (window.MyBotWidget && window.MyBotWidget.mount) {
        window.MyBotWidget.mount({ options: JSON.parse(decodeURIComponent("${encodeURIComponent(
          JSON.stringify(options)
        )}")) });
      } else {
        console.warn("MyBotWidget not available yet.");
      }
    };
    if (document.readyState === "complete") mount();
    else window.addEventListener("load", mount);
  })();
</script>`;

  const preRef = useRef<HTMLTextAreaElement>(null);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      alert("Embed code copied!");
    } catch {
      // Fallback if clipboard API fails
      if (preRef.current) {
        preRef.current.select();
        document.execCommand("copy");
        alert("Embed code copied!");
      }
    }
  };

  return (
    <div className="admin-page">
      <div className="h-row">
        <div className="h-title">Embed</div>
      </div>

      {/* Pretty gradient wrapper with subtle ring that matches Integrations */}
      <div className="admin-section">
        <div className="rounded-2xl border ring-1 ring-border p-0 overflow-hidden bg-gradient-to-r from-emerald-100 via-blue-100 to-indigo-100">
          <div className="flex items-center justify-between px-4 py-3 bg-card/60 backdrop-blur">
            <div className="font-extrabold">Embed Code (copy &amp; paste)</div>
            <button className="btn primary" onClick={copyCode}>
              Copy
            </button>
          </div>

          {/* Code box */}
          <div className="p-4 bg-card">
            <textarea
              ref={preRef}
              readOnly
              className="w-full h-64 font-mono text-sm rounded-xl border p-3 bg-muted/40 whitespace-pre-wrap break-words"
              value={code}
              aria-label="Embed code"
            />
          </div>
        </div>

        {/* Small tips */}
        <div className="mt-4 text-sm text-foreground/70">
          Paste this snippet before the closing <code>&lt;/body&gt;</code> tag on
          any site where you want the chat bubble to appear.
        </div>
      </div>
    </div>
  );
}
