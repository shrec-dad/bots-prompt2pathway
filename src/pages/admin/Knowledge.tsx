// src/pages/admin/Knowledge.tsx
export default function Knowledge() {
  return (
    <div className="mx-auto max-w-6xl p-6 space-y-6">
      {/* Page Header */}
      <div className="rounded-xl border-2 border-black p-6 bg-white shadow">
        <h1 className="text-2xl font-bold">Knowledge</h1>
        <p className="mt-2 text-gray-700">
          Upload product guides, pricing, policies, FAQs — your bot will use this
          knowledge to answer questions.
        </p>
      </div>

      {/* Upload Section */}
      <div className="rounded-xl border-2 border-black p-6 bg-gradient-to-r from-purple-200 via-pink-200 to-green-200 shadow">
        <h2 className="text-xl font-bold">Upload Documents</h2>
        <p className="text-gray-700">
          PDF, Word, Excel (placeholder only — wiring later).
        </p>
        <div className="mt-4 flex gap-4">
          <button className="px-4 py-2 rounded-lg border-2 border-black bg-white shadow font-semibold hover:bg-gray-100">
            + Upload
          </button>
          <button className="px-4 py-2 rounded-lg border-2 border-black bg-white shadow font-semibold hover:bg-gray-100">
            Manage Sources
          </button>
        </div>
      </div>

      {/* Uploaded Documents */}
      <div className="rounded-xl border-2 border-black p-6 bg-white shadow">
        <h2 className="text-xl font-bold">Uploaded Documents</h2>
        <p className="text-gray-700">Static mock data persisted locally.</p>
        <div className="mt-4 rounded-lg border-2 border-black p-4 bg-gradient-to-r from-yellow-100 to-blue-100">
          <p className="text-gray-700">
            No documents yet. Use <span className="font-semibold">+ Upload</span> to
            add PDF/Word/Excel.
          </p>
        </div>
      </div>
    </div>
  );
}
