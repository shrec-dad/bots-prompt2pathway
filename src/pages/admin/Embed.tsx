// src/pages/admin/Embed.tsx
import React, { useMemo } from "react";
import { getJSON } from "@/lib/storage";

/**
 * Reads any branding settings you’re storing (so the embed code reflects it).
 * If you don’t need this, you can hardcode defaults below.
 */
type Branding = {
  mode?: "basic" | "custom";
  language?: string;
  fontFamily?: string;
  logoDataUrl?: string | null;
  chatBubbleImage?: string | null;
  chatBubbleColor?: string;
  whitelist?: string[];
};

const BRANDING_KEY = "brandingSettings";
const FALLBACK: Branding = {
  mode: "basic",
  language: "en",
  fontFamily: "Inter, system-ui, Arial, sans-serif",
  logoDataUrl: null,
  chatBubbleImage: null,
  chatBubbleColor: "#7aa8ff",
  whitelist: [],
};

export default function Embed() {
  const branding = useMemo<Branding>(() => getJSON<Branding>(BRANDING_KEY, FALLBACK), []);

  const options = {
    mode: branding.mode ?? "basic",
    language: branding.language ?? "en",
    whitelist: branding.whitelist ?? [],
    ui: {
      fontFamily: branding.fontFamily ?? FALLBACK.fontFamily!,
      logoDataUrl: branding.logoDataUrl ?? null,
    },
    bubble: {
      image: branding.chatBubbleImage ?? null,
      color: branding.chatBubbleColor ?? FALLBACK.chatBubbleColor!,
    },
  };

  const code = `<script src="https://cdn.example.com/mybot-widget.js" async></script>
<script>
  (function () {
    var mount = function () {
      if (window.MyBotWidget && window.MyBotWidget.mount) {
        window.MyBotWidget.mount({
          options: JSON.parse(decodeURIComponent('${encodeURIComponent(JSON.stringify(options))}'))
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
    try {
      await navigator.clipboard.writeText(code);
      alert("Embed code copied!");
    } catch {
      // Fallback: try to open a prompt if clipboard isn't allowed
      window.prompt("Copy embed code:", code);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-extrabold">Embed</h1>
      <div className="rounded-2xl border ring-1 ring-border p-4 bg-purple-200/40">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xl font-black">Embed Code (copy &amp; paste)</div>
          <button
            onClick={copy}
            className="rounded-xl px-3 py-1.5 font-bold ring-1 ring-border bg-gradient-to-r from-indigo-500/20 to-emerald-500/20 hover:from-indigo-500/30 hover:to-emerald-500/30"
          >
            Copy
          </button>
        </div>

        {/* WRAPPED + scrollable code block */}
        <pre
          className="rounded-xl border bg-white/85 ring-1 ring-border p-4 text-sm whitespace-pre-wrap break-all overflow-auto"
          style={{ maxHeight: 420 }}
        >
{code}
        </pre>
      </div>
    </div>
  );
}
