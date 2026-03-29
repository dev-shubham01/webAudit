import { Search } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import Button from "../../components/ui/button";
import { cardShell, sectionDescClass } from "./dashboard.utils";

export default function NoScanState({ onStartScan }) {
  return (
    <div className="space-y-8 pb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard</h1>
        <p className={`mt-2 ${sectionDescClass}`}>Your scan results will appear here</p>
      </div>
      <Card className={cardShell}>
        <CardContent className="flex flex-col items-center px-6 py-16 text-center">
          <Search className="mb-4 h-12 w-12 text-[#64748B]" aria-hidden />
          <p className="max-w-md text-lg font-medium text-[#E2E8F0]">No scan results yet</p>
          <p className={`mt-2 max-w-md text-sm leading-relaxed ${sectionDescClass}`}>
            Enter a URL on the home page or in the header to analyze performance, SEO,
            and errors. Results will show up here when the run finishes.
          </p>
          <Button
            type="button"
            onClick={onStartScan}
            className="mt-8 rounded-lg bg-[#6366F1] px-6 text-white hover:bg-[#5558E3]"
          >
            Start a scan
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
