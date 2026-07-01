import { useState } from "react";
import { useReport } from "../../context/ReportContext.jsx";

/**
 * Phase 0 scaffold (see docs/ROADMAP.md): proves the job-based crawl API
 * end-to-end. Kept as a raw-JSON debug view now that Overview/Content
 * (Phase 1) are the real report pages. Uses the app-level ReportProvider
 * (see main.jsx) rather than its own nested instance.
 */
export default function ReportsLab() {
  const [url, setUrl] = useState("");
  const { startNewCrawl, loading, error, data, jobStatus } = useReport();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!url.trim() || loading) return;
    try {
      await startNewCrawl(url.trim());
    } catch {
      // error is already surfaced via context state
    }
  }

  return (
    <div className="space-y-6 text-[#E2E8F0]">
      <div>
        <h1 className="text-2xl font-semibold">Reports Lab (Phase 0)</h1>
        <p className="mt-1 text-sm text-[#94A3B8]">
          Minimal end-to-end test of the job-based crawl API: enter a URL,
          start a job, and see the raw report JSON once it finishes.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="example.com"
          className="flex-1 rounded-md border border-[#334155] bg-[#1E293B] px-3 py-2 text-sm text-[#E2E8F0] placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-[#6366F1] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? "Running..." : "Start Crawl"}
        </button>
      </form>

      {loading && (
        <div className="flex items-center gap-3 text-sm text-[#94A3B8]">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#334155] border-t-[#6366F1]" />
          <span>Status: {jobStatus?.status ?? "starting"}...</span>
        </div>
      )}

      {error && (
        <div className="rounded-md border border-[#EF4444]/40 bg-[#450A0A]/40 px-4 py-3 text-sm text-[#FECACA]">
          {error}
        </div>
      )}

      {data && (
        <pre className="max-h-[70vh] overflow-auto rounded-md border border-[#334155] bg-[#0B1220] p-4 text-xs text-[#94A3B8]">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}
