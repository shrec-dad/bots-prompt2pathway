// src/pages/admin/Knowledge.tsx
import React from "react";

export default function Knowledge() {
  return (
    <div className="space-y-6">
      <header className="rounded-xl border p-5 bg-gradient-to-r from-purple-100 via-indigo-100 to-teal-100">
        <h1 className="text-xl font-extrabold">Knowledge</h1>
        <p className="text-sm text-foreground/70">
          Upload FAQs, canned responses, and reference docs your bots can use.
        </p>
      </header>

      <section className="rounded-xl border p-5">
        <p className="text-sm">
          (Coming soon) Add documents, Q&A pairs, and tagging. We’ll wire this
          into your bots once the schema is finalized.
        </p>
      </section>
    </div>
  );
}
