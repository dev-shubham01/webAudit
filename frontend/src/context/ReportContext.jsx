import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  startCrawl,
  getJobStatus,
  getReport,
  listReports,
} from "../services/reportsService.js";

const ReportContext = createContext(null);

const POLL_INTERVAL_MS = 1500;

export function ReportProvider({ children }) {
  const [reportList, setReportList] = useState([]);
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [jobId, setJobId] = useState(null);
  const [jobStatus, setJobStatus] = useState(null);
  const pollTimeoutRef = useRef(null);

  const clearError = useCallback(() => setError(null), []);

  const refreshReportList = useCallback(async () => {
    try {
      const list = await listReports();
      setReportList(list);
      return list;
    } catch (e) {
      setError(e?.message || "Failed to load report history");
      return [];
    }
  }, []);

  const loadReport = useCallback(async (reportId) => {
    setError(null);
    try {
      const report = await getReport(reportId);
      setData(report);
      setSelectedReportId(reportId);
      return report;
    } catch (e) {
      setError(e?.message || "Failed to load report");
      throw e;
    }
  }, []);

  const pollJob = useCallback(
    (id) => {
      clearTimeout(pollTimeoutRef.current);

      const tick = async () => {
        try {
          const status = await getJobStatus(id);
          setJobStatus(status);

          if (status.status === "done" && status.reportId) {
            await loadReport(status.reportId);
            await refreshReportList();
            setLoading(false);
            return;
          }

          if (status.status === "error") {
            setError(status.error || "Crawl failed");
            setLoading(false);
            return;
          }

          pollTimeoutRef.current = setTimeout(tick, POLL_INTERVAL_MS);
        } catch (e) {
          setError(e?.message || "Failed to check job status");
          setLoading(false);
        }
      };

      tick();
    },
    [loadReport, refreshReportList],
  );

  const startNewCrawl = useCallback(
    async (url) => {
      setError(null);
      setLoading(true);
      setData(null);
      setJobStatus(null);
      try {
        const { jobId: newJobId } = await startCrawl(url);
        setJobId(newJobId);
        pollJob(newJobId);
        return newJobId;
      } catch (e) {
        setError(e?.message || "Failed to start crawl");
        setLoading(false);
        throw e;
      }
    },
    [pollJob],
  );

  useEffect(() => () => clearTimeout(pollTimeoutRef.current), []);

  const value = useMemo(
    () => ({
      reportList,
      refreshReportList,
      selectedReportId,
      setSelectedReportId,
      data,
      loading,
      error,
      clearError,
      jobId,
      jobStatus,
      startNewCrawl,
      loadReport,
    }),
    [
      reportList,
      refreshReportList,
      selectedReportId,
      data,
      loading,
      error,
      clearError,
      jobId,
      jobStatus,
      startNewCrawl,
      loadReport,
    ],
  );

  return (
    <ReportContext.Provider value={value}>
      {loading && (
        <div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/60 backdrop-blur-md"
          aria-busy="true"
          aria-live="polite"
        >
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-border border-t-[#6366F1]" />
          <p className="mt-6 text-lg font-medium text-foreground">
            {jobStatus?.status ? `${jobStatus.status}...` : "Starting crawl..."}
          </p>
        </div>
      )}
      {error && !loading && (
        <div className="fixed left-0 right-0 top-0 z-[99] border-b border-[#EF4444]/40 bg-[#450A0A]/95 px-4 py-3 text-center text-sm text-[#FECACA]">
          <span>{error}</span>
          <button
            type="button"
            onClick={clearError}
            className="ml-3 underline decoration-[#FECACA]/50 hover:decoration-[#FECACA]"
          >
            Dismiss
          </button>
        </div>
      )}
      {children}
    </ReportContext.Provider>
  );
}

/* eslint-disable react-refresh/only-export-components -- context hook exported with provider */
export function useReport() {
  const ctx = useContext(ReportContext);
  if (!ctx) {
    throw new Error("useReport must be used within ReportProvider");
  }
  return ctx;
}
