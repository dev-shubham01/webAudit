import { useReport } from "../../context/ReportContext.jsx";
import ContentScreen from "../../features/content/ContentScreen.jsx";

export default function ContentGate() {
  const { data, loading } = useReport();

  if (!data) {
    if (loading) return null; // ReportProvider's full-screen overlay covers this
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center text-center text-muted-foreground">
        <h2 className="text-xl font-semibold text-foreground">No report yet</h2>
        <p className="mt-2 max-w-md text-sm">
          Run a crawl from the Dashboard first to see per-page content details here.
        </p>
      </div>
    );
  }

  return <ContentScreen report={data} />;
}
