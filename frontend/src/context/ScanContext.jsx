import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { runScan as requestScan } from "../services/scanService.js";
import { normalizeScanUrl, isLikelyValidUrl } from "../utils/url.js";

const ScanContext = createContext(null);

export function ScanProvider({ children }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const [scannedUrl, setScannedUrl] = useState(null);
  const [scannedAt, setScannedAt] = useState(null);
  /** Increments on each successful scan so the dashboard can scroll to results */
  const [scanGeneration, setScanGeneration] = useState(0);

  const clearError = useCallback(() => setError(null), []);

  const executeScan = useCallback(async (rawUrl) => {
    const trimmed = (rawUrl ?? "").trim();
    if (!trimmed) {
      const msg = "Please enter a website URL";
      setError(msg);
      throw new Error(msg);
    }
    const normalized = normalizeScanUrl(trimmed);
    if (!isLikelyValidUrl(trimmed)) {
      const msg = "Please enter a valid URL";
      setError(msg);
      throw new Error(msg);
    }

    setError(null);
    setLoading(true);
    try {
      const result = await requestScan(normalized);
      setScanResult(result);
      setScannedUrl(normalized);
      setScannedAt(new Date().toISOString());
      setScanGeneration((g) => g + 1);
      return result;
    } catch (e) {
      const msg =
        e?.message || "Something went wrong. Please try again.";
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const value = useMemo(
    () => ({
      loading,
      setLoading,
      error,
      setError,
      scanResult,
      setScanResult,
      scannedUrl,
      setScannedUrl,
      scannedAt,
      scanGeneration,
      executeScan,
      clearError,
    }),
    [
      loading,
      error,
      scanResult,
      scannedUrl,
      scannedAt,
      scanGeneration,
      executeScan,
      clearError,
    ],
  );

  return (
    <ScanContext.Provider value={value}>
      {loading && (
        <div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0F172A]/60 backdrop-blur-md"
          aria-busy="true"
          aria-live="polite"
        >
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#334155] border-t-[#6366F1]" />
          <p className="mt-6 text-lg font-medium text-[#E2E8F0]">
            Analyzing...
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
    </ScanContext.Provider>
  );
}

/* eslint-disable react-refresh/only-export-components -- context hook exported with provider */
export function useScan() {
  const ctx = useContext(ScanContext);
  if (!ctx) {
    throw new Error("useScan must be used within ScanProvider");
  }
  return ctx;
}
