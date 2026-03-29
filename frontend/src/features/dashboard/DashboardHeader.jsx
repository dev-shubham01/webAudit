import Button from "../../components/ui/button";
import { sectionDescClass } from "./dashboard.utils";

export default function DashboardHeader({ onScanAnother }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard</h1>
        <p className={`mt-2 ${sectionDescClass}`}>Results for your latest scan</p>
      </div>
      <Button
        type="button"
        variant="outline"
        onClick={onScanAnother}
        className="h-10 shrink-0 border-[#334155] text-[#E2E8F0] hover:bg-[#1E293B]"
      >
        Scan another website
      </Button>
    </div>
  );
}
