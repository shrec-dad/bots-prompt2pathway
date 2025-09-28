// src/pages/admin/Embed.tsx
import React, { useMemo } from "react";

const BOX =
  "rounded-2xl border-2 border-black bg-white shadow-[0_6px_0_#000] p-5";

const codeBlock = (s: string) =>
  s.replace(/^\n/, "").replace(/\n\s*$/, "");

export default function Embed() {
  const reactSnippet = useMemo(
    () =>
      codeBlock(`
import ChatWidget from "@/widgets/ChatWidget";

/**
 * Example: place this where you want the widget bubble to appear.
 * mode: "popup" | "inline" | "sidebar"
 * position: "bottom-right" | "bottom-left"
 */
export default function Page() {
  return (
    <>
      {/* your site content... */}
      <ChatWidget
        mode="popup"
        position="bottom-right"
        botId="waitlist-bot"
        color="#A78BFA"  // lavender
        size={64}
      />
    </>
  );
}
`),
    []
  );

  const htmlSnippet = useMemo(
    () =>
      codeBlock(`
<!-- Inline mount example (non-React sites) -->
<div id="my-chat-widget"></div>
<script type="module">
  import ChatWidget from "/src/widgets/ChatWidget.tsx"; // adjust path if needed

  // Minimal client mount:
  const root = document.getElementById("my-chat-widget");
  // If using a bundler, you can hydrate with ReactDOM here.
  // For a simple reference, embed inside your React host app instead.
</script>
`),
    []
  );

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert("Copied to clipboard!");
    } catch {
      alert("Could not copy. Select the text and copy manually.");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <header className={`${BOX} bg-gradient-to-r from-purple-100 via-indigo-100 to-teal-100`}>
        <h1 className="text-2xl font-extrabold">Embed Code</h1>
        <p className="text-black/70 mt-1">
          Add your bot widget to any page. Use the React snippet inside your app,
          or the inline example for non-React sites (adjust paths as needed).
        </p>
      </header>

      {/* React snippet */}
      <section className={BOX}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-lg">React (recommended)</h2>
          <button
            onClick={() => copy(reactSnippet)}
            className="px-3 py-2 rounded-lg border-2 border-black bg-white hover:bg-black hover:text-white transition"
          >
            Copy
          </button>
        </div>
        <pre className="overflow-auto text-sm rounded-xl border bg-muted/30 p-4">
          <code>{reactSnippet}</code>
        </pre>
      </section>

      {/* HTML snippet */}
      <section className={BOX}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-lg">Plain HTML (advanced)</h2>
          <button
            onClick={() => copy(htmlSnippet)}
            className="px-3 py-2 rounded-lg border-2 border-black bg-white hover:bg-black hover:text-white transition"
          >
            Copy
          </button>
        </div>
        <pre className="overflow-auto text-sm rounded-xl border bg-muted/30 p-4">
          <code>{htmlSnippet}</code>
        </pre>
        <p className="text-xs text-black/60 mt-3">
          Tip: For non-React sites you’ll typically ship a tiny UMD bundle (e.g.
          <code> window.ChatWidget.mount(el, opts)</code>). We can add that build
          step later if you want external, drop-in usage.
        </p>
      </section>
    </div>
  );
}
