// src/pages/admin/Embed.tsx
import React from "react";
import { useAdminStore } from "@/lib/AdminStore";

const card = "rounded-2xl border-[2px] border-black/80 shadow-[0_6px_0_#000] bg-white";
const grad = "bg-[linear-gradient(135deg,#f7d7ff_0%,#dfe4ff_40%,#c8f4ea_100%)]";

export default function Embed() {
  const { currentBot } = useAdminStore();

  const popup = `<script type="module" src="/widget.js"></script>
<div id="my-chat"></div>
<script>
  // Example mount – adapt to your widget bundling
  window.initChatWidget?.("#my-chat", {
    botId: "${currentBot}",
    mode: "popup",
    position: "bottom-right",
    color: "#b392ff"
  });
</script>`;

  const inline = `<div id="inline-bot"></div>
<script>
  window.initChatWidget?.("#inline-bot", {
    botId: "${currentBot}",
    mode: "inline",
    width: 420
  });
</script>`;

  return (
    <div className="p-4 md:p-6">
      <div className={`${card} ${grad} p-5 mb-5`}>
        <h1 className="text-2xl font-extrabold">Embed Code</h1>
        <p className="mt-1 text-black/70">
          Copy these snippets to embed the <b>{currentBot}</b> bot on your site.
        </p>
      </div>

      <div className={`${card} p-5 mb-5`}>
        <div className="font-bold mb-2">Popup bubble (recommended)</div>
        <pre className="bg-black text-white p-3 rounded-lg overflow-auto text-xs">
{popup}
        </pre>
      </div>

      <div className={`${card} p-5`}>
        <div className="font-bold mb-2">Inline (embed in page content)</div>
        <pre className="bg-black text-white p-3 rounded-lg overflow-auto text-xs">
{inline}
        </pre>
      </div>
    </div>
  );
}
