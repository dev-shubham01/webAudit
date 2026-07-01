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
    <ReportContext.Provider value={value}>{children}</ReportContext.Provider>
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
