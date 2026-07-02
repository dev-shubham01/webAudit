import { useReport } from "../../context/ReportContext.jsx";
import SecurityScreen from "../../features/security/SecurityScreen.jsx";

export default function SecurityGate() {
  const { data, loading } = useReport();

  if (!data) {
    if (loading) return null; // ReportProvider's full-screen overlay covers this
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center text-center text-[#94A3B8]">
        <h2 className="text-xl font-semibold text-[#E2E8F0]">No report yet</h2>
        <p className="mt-2 max-w-md text-sm">
          Run a crawl from the Dashboard first to see security findings here.
        </p>
      </div>
    );
  }

  return <SecurityScreen report={data} />;
}
