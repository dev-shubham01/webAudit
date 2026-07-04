import { useReport } from "../../context/ReportContext.jsx";
import OverviewScreen from "../../features/overview/OverviewScreen.jsx";

export default function DashboardGate() {
  const { data, loading } = useReport();

  if (!data) {
    if (loading) return null; // ReportProvider's full-screen overlay covers this
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center text-center text-muted-foreground">
        <h2 className="text-xl font-semibold text-foreground">No report yet</h2>
        <p className="mt-2 max-w-md text-sm">
          Enter a URL above and click Analyze to crawl a site and see its
          health report here.
        </p>
      </div>
    );
  }

  return <OverviewScreen report={data} />;
}
