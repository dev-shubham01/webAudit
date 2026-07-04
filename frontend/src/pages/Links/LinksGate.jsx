import { useReport } from "../../context/ReportContext.jsx";
import LinksScreen from "../../features/links/LinksScreen.jsx";

export default function LinksGate() {
  const { data, loading } = useReport();

  if (!data) {
    if (loading) return null; // ReportProvider's full-screen overlay covers this
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center text-center text-muted-foreground">
        <h2 className="text-xl font-semibold text-foreground">No report yet</h2>
        <p className="mt-2 max-w-md text-sm">
          Run a crawl from the Dashboard first to explore individual links here.
        </p>
      </div>
    );
  }

  return <LinksScreen report={data} />;
}
