// src/pages/admin/Embed.tsx
import React, { useRef } from "react";
import "../../styles/admin-shared.css";

export default function Embed() {
  const codeRef = useRef<HTMLTextAreaElement>(null);

  const code = `<script src="https://cdn.example.com/mybot-widget.js" async></script>
<script>
  (function () {
    var mount = function () {
      if (window.MyBotWidget && window.MyBotWidget.mount) {
        window.MyBotWidget.mount({
          options: JSON.parse(decodeURIComponent("%7Bmode%3A'basic'%7D"))
        });
      } else {
        console.warn("MyBotWidget not available yet.");
      }
    };
    if (document.readyState === "complete") mount();
    else window.addEventListener("load", mount);
  })();
</script>`;

  const copyToClipboard = () => {
    if (codeRef.current) {
      codeRef.current.select();
      document.execCommand("copy");
      alert("Embed code copied!");
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Fancy Header */}
      <div className="rounded-2xl border-2 border-black p-6 bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200">
        <h1 className="text-2xl font-extrabold text-black">Embed Your Bot</h1>
        <p className="mt-2 text-black">
          Copy and paste the code below into your website to activate your bot.
        </p>
      </div>

      {/* Code Box */}
      <div className="rounded-2xl border-2 border-black bg-gray-900 p-4 relative">
        <textarea
          ref={codeRef}
          value={code}
          readOnly
          className="w-full h-60 bg-gray-900 text-green-200 font-mono text-sm resize-none border-none focus:outline-none"
        />
        <button
          onClick={copyToClipboard}
          className="absolute top-3 right-3 px-3 py-1 bg-white border-2 border-black rounded-lg font-bold text-black hover:bg-gray-100"
        >
          Copy
        </button>
      </div>
    </div>
  );
}
