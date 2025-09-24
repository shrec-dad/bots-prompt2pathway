export default function Knowledge() {
  return (
    <div className="min-h-screen bg-[#1D2D5C] text-white p-8">
      {/* Premium header */}
      <div className="mb-6 rounded-xl border border-[#FFD700]/40 bg-gradient-to-r from-[#243C7A] to-[#1D2D5C] p-6 shadow-lg">
        <h1 className="text-3xl font-extrabold text-[#FFD700]">Knowledge</h1>
        <p className="mt-2 text-lg text-gray-200">
          Upload product guides, pricing, policies, FAQs — your bot will use this
          knowledge to answer questions.
        </p>
      </div>

      {/* Upload Section */}
      <div className="mb-6 rounded-xl border border-[#FFD700]/40 bg-[#243C7A] p-6 shadow-lg">
        <h2 className="text-xl font-bold text-[#FFD700]">Upload Documents</h2>
        <p className="mt-1 text-gray-300">
          PDF, Word, Excel (placeholder only — wiring comes later).
        </p>
        <div className="mt-4 flex gap-4">
          <button className="rounded-lg bg-[#FFD700] px-5 py-2 font-bold text-[#1D2D5C] shadow-md hover:bg-[#E6C200] transition">
            + Upload
          </button>
          <button className="rounded-lg border border-[#FFD700] px-5 py-2 font-bold text-[#FFD700] hover:bg-[#FFD700] hover:text-[#1D2D5C] transition">
            Manage Sources
          </button>
        </div>
      </div>

      {/* Uploaded Documents */}
      <div className="rounded-xl border border-[#FFD700]/40 bg-[#243C7A] p-6 shadow-lg">
        <h2 className="text-xl font-bold text-[#FFD700]">Uploaded Documents</h2>
        <p className="mt-1 text-gray-300">Static mock data for now.</p>
        <ul className="mt-4 space-y-3">
          <li className="flex items-center justify-between rounded-lg bg-[#1D2D5C] p-4 shadow">
            <span className="font-semibold text-white">Pricing Guide 2025.pdf</span>
            <div className="flex gap-2">
              <button className="rounded bg-[#FFD700] px-3 py-1 text-sm font-bold text-[#1D2D5C] hover:bg-[#E6C200]">
                Preview
              </button>
              <button className="rounded border border-[#FFD700] px-3 py-1 text-sm font-bold text-[#FFD700] hover:bg-[#FFD700] hover:text-[#1D2D5C]">
                Remove
              </button>
            </div>
          </li>
          <li className="flex items-center justify-between rounded-lg bg-[#1D2D5C] p-4 shadow">
            <span className="font-semibold text-white">Onboarding Playbook.docx</span>
            <div className="flex gap-2">
              <button className="rounded bg-[#FFD700] px-3 py-1 text-sm font-bold text-[#1D2D5C] hover:bg-[#E6C200]">
                Preview
              </button>
              <button className="rounded border border-[#FFD700] px-3 py-1 text-sm font-bold text-[#FFD700] hover:bg-[#FFD700] hover:text-[#1D2D5C]">
                Remove
              </button>
            </div>
          </li>
        </ul>
      </div>
    </div>
  );
}
