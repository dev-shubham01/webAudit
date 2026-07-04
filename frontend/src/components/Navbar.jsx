import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Search, Download } from "lucide-react";
import Input from "./ui/input";
import Button from "./ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { useReport } from "../context/ReportContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";

function initials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return parts.length === 1 ? parts[0].slice(0, 2).toUpperCase() : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const URL_HELPER =
  "Enter any website URL to analyze performance, SEO, and errors";

export function Navbar() {
  const [url, setUrl] = useState("");
  const { startNewCrawl, loading, data } = useReport();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (data?.url) setUrl(data.url);
  }, [data]);

  const handleAnalyze = async () => {
    try {
      await startNewCrawl(url);
      navigate("/dashboard", { replace: location.pathname === "/dashboard" });
    } catch {
      /* error shown in ReportProvider banner */
    }
  };

  const canDownload = Boolean(user) && Boolean(data);
  const downloadTitle = !user
    ? "Sign in to download report"
    : !data
      ? "No report to download yet"
      : "Download Report";

  const handleDownload = async () => {
    if (!canDownload) return;
    const { generateReportPdf } = await import("../utils/pdfReport.js");
    generateReportPdf(data);
  };

  return (
    <header className="flex min-h-16 flex-wrap items-center justify-between gap-4 border-b border-border bg-background px-8 py-3">
      <div className="flex max-w-2xl flex-1 flex-col gap-1">
        <div className="flex items-center gap-4">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Enter website URL"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleAnalyze();
              }}
              className="h-10 w-full rounded-lg border border-border bg-card pl-10 text-foreground placeholder:text-muted-foreground focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1]"
            />
          </div>
          <Button
            type="button"
            disabled={loading}
            onClick={() => void handleAnalyze()}
            className="h-10 shrink-0 rounded-lg bg-[#6366F1] px-6 text-white hover:bg-[#5558E3] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Analyze
          </Button>
        </div>
        <p className="text-xs leading-snug text-[#64748B]">{URL_HELPER}</p>
      </div>

      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          title={downloadTitle}
          aria-label={downloadTitle}
          disabled={!canDownload}
          onClick={() => void handleDownload()}
          className="relative h-9 w-9 text-muted-foreground hover:bg-card hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
        >
          <Download className="h-5 w-5" />
        </Button>
        <Avatar className="h-8 w-8">
          {user && <AvatarImage src={user.picture} alt={user.name} />}
          <AvatarFallback className="bg-[#6366F1] text-white text-sm">
            {initials(user?.name)}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
export default Navbar;
