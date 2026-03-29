import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import {
  TrendingUp,
  Search,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Lightbulb,
  Gauge,
} from "lucide-react";
import { Badge } from "../../components/ui/badge";
import Button from "../../components/ui/button";
import { useScan } from "../../context/ScanContext.jsx";
import { generateInsights } from "../../utils/generateInsights.js";

/* Hero + KPI bands: green 90+, yellow 70–89, red under 70 */
function scoreBand(score) {
  const n = Number(score);
  if (!Number.isFinite(n)) return "bad";
  if (n >= 90) return "good";
  if (n >= 70) return "warn";
  return "bad";
}

const bandStyles = {
  good: {
    text: "text-[#22C55E]",
    bg: "bg-[#22C55E]/10",
    border: "border-[#22C55E]/40",
    ring: "ring-[#22C55E]/20",
    bar: "bg-[#22C55E]",
  },
  warn: {
    text: "text-[#EAB308]",
    bg: "bg-[#EAB308]/10",
    border: "border-[#EAB308]/40",
    ring: "ring-[#EAB308]/20",
    bar: "bg-[#EAB308]",
  },
  bad: {
    text: "text-[#EF4444]",
    bg: "bg-[#EF4444]/10",
    border: "border-[#EF4444]/40",
    ring: "ring-[#EF4444]/20",
    bar: "bg-[#EF4444]",
  },
};

function heroMessage(overall) {
  if (!Number.isFinite(overall)) {
    return "Run a scan to see how your site is doing.";
  }
  if (overall >= 90) return "Your website is performing very well.";
  if (overall >= 70) {
    return "Solid foundation — a few improvements could lift your score further.";
  }
  if (overall >= 50) {
    return "Several areas need attention to improve overall health.";
  }
  return "Important issues detected — prioritize fixes below.";
}

function kpiHint(kind, value) {
  const band = scoreBand(value);
  if (kind === "performance") {
    if (band === "good") return "Load and runtime are in great shape.";
    if (band === "warn") return "Room to optimize speed and Core Web Vitals.";
    return "Performance likely hurting UX — focus on LCP and blocking assets.";
  }
  if (kind === "seo") {
    if (band === "good") return "Strong on-page SEO signals.";
    if (band === "warn") return "Fix titles, meta, or headings to improve SEO.";
    return "Critical SEO gaps — see insights for next steps.";
  }
  if (band === "good") return "Few console or network issues detected.";
  if (band === "warn") return "Some errors detected — review the list below.";
  return "Many errors — stability and trust are at risk.";
}

function formatMs(value) {
  if (value == null || !Number.isFinite(value)) return "—";
  if (value >= 1000) return `${(value / 1000).toFixed(2)} s`;
  return `${Math.round(value)} ms`;
}

/** FCP / LCP in ms, CLS unitless */
function vitalRating(name, value) {
  if (value == null || !Number.isFinite(value)) {
    return { label: "No data", band: "muted" };
  }
  if (name === "cls") {
    if (value <= 0.1) return { label: "Good", band: "good" };
    if (value <= 0.25) return { label: "Needs improvement", band: "warn" };
    return { label: "Poor", band: "bad" };
  }
  if (name === "fcp") {
    if (value <= 1800) return { label: "Good", band: "good" };
    if (value <= 3000) return { label: "Needs improvement", band: "warn" };
    return { label: "Poor", band: "bad" };
  }
  if (name === "lcp") {
    if (value <= 2500) return { label: "Good", band: "good" };
    if (value <= 4000) return { label: "Needs improvement", band: "warn" };
    return { label: "Poor", band: "bad" };
  }
  return { label: "—", band: "muted" };
}

function insightSeverityStyle(severity) {
  const s = String(severity || "").toLowerCase();
  if (s === "high") {
    return {
      border: "border-l-[#EF4444]",
      badge: "bg-[#EF4444]/15 text-[#FCA5A5] border border-[#EF4444]/30",
      dot: "bg-[#EF4444]",
    };
  }
  if (s === "medium") {
    return {
      border: "border-l-[#EAB308]",
      badge: "bg-[#EAB308]/15 text-[#FDE047] border border-[#EAB308]/30",
      dot: "bg-[#EAB308]",
    };
  }
  return {
    border: "border-l-[#3B82F6]",
    badge: "bg-[#3B82F6]/15 text-[#93C5FD] border border-[#3B82F6]/30",
    dot: "bg-[#3B82F6]",
  };
}

function severityEmoji(severity) {
  const s = String(severity || "").toLowerCase();
  if (s === "high") return "❌";
  if (s === "medium") return "⚠️";
  return "✅";
}

const cardShell =
  "rounded-xl border border-[#334155] bg-[#1E293B] shadow-lg shadow-black/25 transition-all duration-200 hover:border-indigo-500 hover:shadow-md";

/** Section titles inside cards — slightly larger, muted slate for hierarchy */
const sectionTitleClass =
  "text-xl font-semibold tracking-tight text-[#E2E8F0]";
const sectionDescClass = "text-sm text-[#94A3B8]";

export function Dashboard() {
  const { scanResult, scannedUrl, scannedAt, scanGeneration } = useScan();
  const navigate = useNavigate();
  const resultsAnchorRef = useRef(null);
  const lastScrolledGenRef = useRef(0);

  useEffect(() => {
    if (!scanResult || scanGeneration < 1) return;
    if (lastScrolledGenRef.current === scanGeneration) return;
    lastScrolledGenRef.current = scanGeneration;
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        resultsAnchorRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    });
    return () => cancelAnimationFrame(id);
  }, [scanResult, scanGeneration]);

  if (!scanResult) {
    return (
      <div className="space-y-8 pb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Dashboard
          </h1>
          <p className={`mt-2 ${sectionDescClass}`}>
            Your scan results will appear here
          </p>
        </div>
        <Card className={cardShell}>
          <CardContent className="flex flex-col items-center px-6 py-16 text-center">
            <Search
              className="mb-4 h-12 w-12 text-[#64748B]"
              aria-hidden
            />
            <p className="max-w-md text-lg font-medium text-[#E2E8F0]">
              No scan results yet
            </p>
            <p className={`mt-2 max-w-md text-sm leading-relaxed ${sectionDescClass}`}>
              Enter a URL on the home page or in the header to analyze performance,
              SEO, and errors. Results will show up here when the run finishes.
            </p>
            <Button
              type="button"
              onClick={() => navigate("/")}
              className="mt-8 rounded-lg bg-[#6366F1] px-6 text-white hover:bg-[#5558E3]"
            >
              Start a scan
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const score = scanResult.score;
  const breakdown = score?.breakdown;
  const seo = scanResult.seo;
  const performance = scanResult.performance;
  const consoleErrors = Array.isArray(scanResult.consoleErrors)
    ? scanResult.consoleErrors
    : [];
  const networkErrors = Array.isArray(scanResult.networkErrors)
    ? scanResult.networkErrors
    : [];
  const links = scanResult?.links ?? {
    totalLinks: 0,
    checkedLinks: 0,
    brokenLinks: [],
    successCount: 0,
    unknownLinks: [],
  };
  const brokenLinks = Array.isArray(links?.brokenLinks) ? links.brokenLinks : [];
  const brokenLinksCount = brokenLinks.length;
  const totalLinksCount = Number(links?.totalLinks) || 0;
  const successLinksCount = Number(links?.successCount) || 0;

  const overallScore = Number(score?.overallScore) || 0;
  const perfScore =
    breakdown?.performance ?? performance?.performanceScore ?? 0;
  const seoScore = breakdown?.seo ?? 0;
  const stabilityScore = breakdown?.errors ?? 0;

  const heroBand = scoreBand(overallScore);
  const hero = bandStyles[heroBand];

  const insights = generateInsights({
    seo,
    performance,
    consoleErrors,
    networkErrors,
    links,
  });

  const hasRealTitle =
    typeof seo?.title === "string" &&
    seo.title.trim() !== "" &&
    seo.title !== "Missing";
  const hasRealMeta =
    typeof seo?.metaDescription === "string" &&
    seo.metaDescription.trim() !== "" &&
    seo.metaDescription !== "Missing";
  const h1Count = Number(seo?.h1?.count) || 0;
  const h1Present = h1Count >= 1;
  const h1OkSingle = h1Count === 1;
  const missingAlt = Number(seo?.images?.missingAlt) || 0;
  const totalImages = Number(seo?.images?.total) || 0;
  const altOk = totalImages === 0 || missingAlt === 0;

  const host =
    scannedUrl != null
      ? (() => {
          try {
            return new URL(scannedUrl).hostname;
          } catch {
            return scannedUrl;
          }
        })()
      : "—";

  const dateLabel = scannedAt
    ? new Date(scannedAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "—";

  const errorItems = [
    ...consoleErrors.map((err, i) => ({
      key: `c-${i}`,
      message: typeof err === "string" ? err : JSON.stringify(err),
      severity:
        String(err).length > 200 || consoleErrors.length >= 5
          ? "high"
          : "medium",
    })),
    ...networkErrors.map((n, i) => ({
      key: `n-${i}`,
      message:
        typeof n === "object" && n != null
          ? `HTTP ${n.status ?? "?"} — ${n.url ?? "request"}`
          : String(n),
      severity: Number(n?.status) >= 500 ? "high" : "medium",
    })),
  ];

  const fcp = performance?.metrics?.fcp;
  const lcp = performance?.metrics?.lcp;
  const cls = performance?.metrics?.cls;

  const fcpR = vitalRating("fcp", fcp);
  const lcpR = vitalRating("lcp", lcp);
  const clsR = vitalRating("cls", cls);

  return (
    <div className="space-y-8 pb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Dashboard
          </h1>
          <p className={`mt-2 ${sectionDescClass}`}>
            Results for your latest scan
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate("/")}
          className="h-10 shrink-0 border-[#334155] text-[#E2E8F0] hover:bg-[#1E293B]"
        >
          Scan another website
        </Button>
      </div>

      <div ref={resultsAnchorRef} className="scroll-mt-6 space-y-8">
      {/* 1. Hero score */}
      <Card
        className={`${cardShell} overflow-hidden ring-1 ${hero.ring} ${hero.border}`}
      >
        <div className={`h-1.5 w-full ${hero.bar}`} />
        <CardContent className="px-6 py-10 text-center">
          <p className="text-xs font-medium uppercase tracking-wider text-[#94A3B8]">
            Overall health score
          </p>
          <div
            className={`mt-2 text-7xl font-bold tabular-nums tracking-tight sm:text-8xl ${hero.text}`}
          >
            {Math.round(overallScore)}
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            <Badge
              className={`${hero.bg} ${hero.text} border-0 px-3 py-1 text-sm font-semibold`}
            >
              {score?.label ?? "—"}
            </Badge>
          </div>
          <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-[#CBD5E1]">
            {heroMessage(overallScore)}
          </p>
        </CardContent>
      </Card>

      <Card className={cardShell}>
        <CardHeader className="border-b border-[#334155] pb-4">
          <CardTitle className={sectionTitleClass}>Website Preview</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {scanResult?.screenshot ? (
            <div className="max-h-[min(70vh,720px)] w-full scroll-smooth overflow-auto rounded-lg border border-[#334155] bg-[#0F172A] p-2">
              <img
                src={`data:image/png;base64,${scanResult.screenshot}`}
                alt="Website Preview"
                className="w-full rounded-xl"
              />
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-[#334155] bg-[#0F172A]/60 px-4 py-6 text-center">
              <p className="text-sm text-[#94A3B8]">Preview not available</p>
              <p className="mt-1 text-xs text-[#64748B]">
                (Some websites block automated rendering)
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2. KPI cards */}
      <div className="grid gap-8 md:grid-cols-3">
        {[
          {
            title: "Performance",
            value: perfScore,
            icon: TrendingUp,
            kind: "performance",
          },
          {
            title: "SEO",
            value: seoScore,
            icon: Search,
            kind: "seo",
          },
          {
            title: "Stability",
            value: stabilityScore,
            icon: AlertCircle,
            kind: "stability",
          },
        ].map((item) => {
          const { title, value, icon: IconComponent, kind } = item;
          const band = scoreBand(value);
          const b = bandStyles[band];
          return (
            <Card
              key={title}
              className={`${cardShell} relative overflow-hidden pl-1`}
            >
              <div className={`absolute left-0 top-0 h-full w-1 ${b.bar}`} />
              <CardHeader className="flex flex-row items-center justify-between pb-2 pl-5">
                <CardTitle className="text-sm font-medium text-[#94A3B8]">
                  {title}
                </CardTitle>
                <IconComponent className={`h-5 w-5 ${b.text}`} />
              </CardHeader>
              <CardContent className="pl-5">
                <div className={`text-4xl font-bold tabular-nums ${b.text}`}>
                  {Math.round(Number(value) || 0)}
                </div>
                <p className="mt-3 text-sm leading-snug text-[#94A3B8]">
                  {kpiHint(kind, value)}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 3. Insights */}
      <Card className={cardShell}>
        <CardHeader className="border-b border-[#334155] pb-4">
          <CardTitle
            className={`flex items-center gap-2 ${sectionTitleClass}`}
          >
            <Lightbulb className="h-5 w-5 shrink-0 text-[#6366F1]" />
            Insights
          </CardTitle>
          <p className={sectionDescClass}>
            Prioritized actions to improve your site
          </p>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          {insights.length === 0 ? (
            <p className="rounded-lg border border-[#334155] bg-[#0F172A]/80 px-4 py-6 text-center text-sm text-[#94A3B8]">
              No issues flagged for this scan. Keep monitoring as you ship
              changes.
            </p>
          ) : (
            insights.map((item, i) => {
              const sev = insightSeverityStyle(item.severity);
              const message = item.message ?? "Issue";
              return (
                <div
                  key={i}
                  className={`rounded-xl border border-[#334155] bg-[#0F172A]/60 pl-4 transition-all duration-200 ${sev.border} border-l-4 hover:bg-[#0F172A]/90`}
                >
                  <div className="flex flex-col gap-2 p-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${sev.badge}`}
                        >
                          <span className="mr-1" aria-hidden>
                            {severityEmoji(item.severity)}
                          </span>
                          {String(item.severity || "low")}
                        </span>
                        <span className="text-xs font-medium uppercase tracking-wide text-[#64748B]">
                          {item.type ?? "General"}
                        </span>
                      </div>
                      <p className="mt-2 font-medium text-[#E2E8F0]">
                        {message}
                      </p>
                      {item.why ? (
                        <p className="mt-2 text-sm leading-relaxed text-[#94A3B8]">
                          <span className="font-medium text-[#CBD5E1]">
                            Why it matters:{" "}
                          </span>
                          {item.why}
                        </p>
                      ) : null}
                      {item.fix ? (
                        <p className="mt-2 text-sm leading-relaxed text-[#94A3B8]">
                          <span className="font-medium text-[#CBD5E1]">
                            Fix:{" "}
                          </span>
                          {item.fix}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* 4. SEO details */}
      <Card className={cardShell}>
        <CardHeader className="border-b border-[#334155] pb-4">
          <CardTitle className={sectionTitleClass}>SEO snapshot</CardTitle>
          <p className={sectionDescClass}>
            Quick checks from the crawled page
          </p>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <SeoRow
              label="Title"
              ok={hasRealTitle}
              okText="Present"
              badText="Missing or empty"
              detail={hasRealTitle ? truncate(seo?.title, 48) : null}
            />
            <SeoRow
              label="Meta description"
              ok={hasRealMeta}
              okText="Present"
              badText="Missing"
              detail={hasRealMeta ? truncate(seo?.metaDescription, 48) : null}
            />
            <SeoRow
              label="H1 heading"
              ok={h1OkSingle}
              okText="Single H1 present"
              badText={
                h1Count === 0 ? "No H1 found" : `${h1Count} H1 headings`
              }
              detail={
                h1Present && h1Count > 1
                  ? "Use one primary H1 per page"
                  : undefined
              }
            />
            <SeoRow
              label="Image alt text"
              ok={altOk}
              okText={
                totalImages === 0
                  ? "No images"
                  : "All images have alt"
              }
              badText={`${missingAlt} missing`}
              detail={
                !altOk && totalImages > 0
                  ? `${missingAlt} of ${totalImages} images`
                  : undefined
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* 5. Errors */}
      <Card className={cardShell}>
        <CardHeader className="border-b border-[#334155] pb-4">
          <CardTitle className={sectionTitleClass}>Errors</CardTitle>
          <p className={sectionDescClass}>
            Console and failed network responses
          </p>
        </CardHeader>
        <CardContent className="pt-6">
          {errorItems.length === 0 ? (
            <div className="flex items-center gap-3 rounded-xl border border-[#22C55E]/30 bg-[#22C55E]/5 px-4 py-5 text-[#86EFAC]">
              <CheckCircle2 className="h-6 w-6 shrink-0 text-[#22C55E]" aria-hidden />
              <span className="font-medium">
                <span aria-hidden>✅ </span>
                No critical errors detected
              </span>
            </div>
          ) : (
            <ul className="space-y-4">
              {errorItems.map((item) => {
                const st = insightSeverityStyle(item.severity);
                return (
                  <li
                    key={item.key}
                    className="flex gap-3 rounded-xl border border-[#334155] bg-[#0F172A]/60 p-4 transition-all duration-200 hover:bg-[#0F172A]/90"
                  >
                    <span
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${st.dot}`}
                    />
                    <div className="min-w-0 flex-1">
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${st.badge}`}
                      >
                        {item.severity}
                      </span>
                      <p className="mt-2 break-words font-mono text-sm text-[#E2E8F0]">
                        {item.message}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* 6. Links */}
      <Card className={cardShell}>
        <CardHeader className="border-b border-[#334155] pb-4">
          <CardTitle className={sectionTitleClass}>Links</CardTitle>
          <p className={sectionDescClass}>
            Link health summary from checked page anchors
          </p>
        </CardHeader>
        <CardContent className="space-y-5 pt-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-[#334155] bg-[#0F172A]/60 px-4 py-4">
              <p className="text-xs uppercase tracking-wide text-[#94A3B8]">
                Total Links
              </p>
              <p className="mt-2 text-3xl font-bold tabular-nums text-[#E2E8F0]">
                {totalLinksCount}
              </p>
            </div>
            <div
              className={`rounded-xl border px-4 py-4 ${
                brokenLinksCount > 0
                  ? "border-[#EF4444]/40 bg-[#EF4444]/10"
                  : "border-[#334155] bg-[#0F172A]/60"
              }`}
            >
              <p className="text-xs uppercase tracking-wide text-[#94A3B8]">
                Broken Links
              </p>
              <p
                className={`mt-2 text-3xl font-bold tabular-nums ${
                  brokenLinksCount > 0 ? "text-[#FCA5A5]" : "text-[#E2E8F0]"
                }`}
              >
                {brokenLinksCount}
              </p>
            </div>
            <div className="rounded-xl border border-[#334155] bg-[#0F172A]/60 px-4 py-4">
              <p className="text-xs uppercase tracking-wide text-[#94A3B8]">
                Success Count
              </p>
              <p className="mt-2 text-3xl font-bold tabular-nums text-[#86EFAC]">
                {successLinksCount}
              </p>
            </div>
          </div>

          {brokenLinksCount > 0 ? (
            <div className="rounded-xl border border-[#EF4444]/40 bg-[#7F1D1D]/20 p-4">
              <p className="mb-3 text-sm font-semibold text-[#FCA5A5]">
                Broken link list
              </p>
              <ul className="space-y-2">
                {brokenLinks.map((item, index) => {
                  const urlText =
                    typeof item?.url === "string" && item.url.trim()
                      ? item.url
                      : "Unknown URL";
                  const statusText =
                    item?.status == null ? "request failed" : `HTTP ${item.status}`;
                  return (
                    <li
                      key={`${urlText}-${index}`}
                      className="rounded-lg border border-[#EF4444]/30 bg-[#0F172A]/70 px-3 py-2 text-sm text-[#FECACA]"
                    >
                      <span className="font-medium text-[#FCA5A5]">
                        {statusText}
                      </span>
                      <span className="mx-2 text-[#7F1D1D]">-</span>
                      <span className="break-all">{urlText}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-xl border border-[#22C55E]/30 bg-[#22C55E]/5 px-4 py-4 text-[#86EFAC]">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-[#22C55E]" aria-hidden />
              <p className="font-medium">✅ No broken links detected</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 7. Performance metrics */}
      <Card className={cardShell}>
        <CardHeader className="border-b border-[#334155] pb-4">
          <CardTitle
            className={`flex items-center gap-2 ${sectionTitleClass}`}
          >
            <Gauge className="h-5 w-5 shrink-0 text-[#6366F1]" />
            Performance metrics
          </CardTitle>
          <p className={sectionDescClass}>
            Core Web Vitals thresholds (lab)
          </p>
        </CardHeader>
        <CardContent className="space-y-0 pt-2">
          {[
            { name: "FCP", sub: "First Contentful Paint", value: fcp, rating: fcpR },
            { name: "LCP", sub: "Largest Contentful Paint", value: lcp, rating: lcpR },
            { name: "CLS", sub: "Cumulative Layout Shift", value: cls, rating: clsR, isCls: true },
          ].map((row, idx) => (
            <div
              key={row.name}
              className={`flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between ${
                idx < 2 ? "border-b border-[#334155]" : ""
              }`}
            >
              <div>
                <div className="font-medium text-[#E2E8F0]">{row.name}</div>
                <div className="text-xs text-[#64748B]">{row.sub}</div>
              </div>
              <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                <span className="tabular-nums text-lg text-[#F8FAFC]">
                  {row.isCls
                    ? cls != null && Number.isFinite(cls)
                      ? cls.toFixed(3)
                      : "—"
                    : formatMs(row.value)}
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    row.rating.band === "good"
                      ? "bg-[#22C55E]/15 text-[#86EFAC]"
                      : row.rating.band === "warn"
                        ? "bg-[#EAB308]/15 text-[#FDE047]"
                        : row.rating.band === "bad"
                          ? "bg-[#EF4444]/15 text-[#FCA5A5]"
                          : "bg-[#334155] text-[#94A3B8]"
                  }`}
                >
                  <span className="mr-1" aria-hidden>
                    {row.rating.band === "good"
                      ? "✅"
                      : row.rating.band === "warn"
                        ? "⚠️"
                        : row.rating.band === "bad"
                          ? "❌"
                          : ""}
                  </span>
                  {row.rating.label}
                </span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 8. Recent scans */}
      <Card className={cardShell}>
        <CardHeader className="border-b border-[#334155] pb-4">
          <CardTitle className={sectionTitleClass}>Recent scans</CardTitle>
          <p className={sectionDescClass}>
            Latest scan shown below — run again from the header to refresh
          </p>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#334155]">
                  <th className="pb-3 text-left text-sm font-medium text-[#94A3B8]">
                    Website
                  </th>
                  <th className="pb-3 text-left text-sm font-medium text-[#94A3B8]">
                    Score
                  </th>
                  <th className="pb-3 text-left text-sm font-medium text-[#94A3B8]">
                    Status
                  </th>
                  <th className="pb-3 text-left text-sm font-medium text-[#94A3B8]">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-3 text-[#E2E8F0]">{host}</td>
                  <td className="py-3">
                    <span
                      className={`font-semibold tabular-nums ${bandStyles[heroBand].text}`}
                    >
                      {Math.round(overallScore)}
                    </span>
                  </td>
                  <td className="py-3">
                    <Badge
                      className={`${bandStyles[heroBand].bg} ${bandStyles[heroBand].text} border-0`}
                    >
                      {score?.label ?? "—"}
                    </Badge>
                  </td>
                  <td className="py-3 text-[#94A3B8]">{dateLabel}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}

function truncate(str, max) {
  if (typeof str !== "string") return null;
  const t = str.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function SeoRow({ label, ok, okText, badText, detail }) {
  const statusEmoji = ok ? "✅" : "❌";
  const statusText = ok ? okText : badText;
  return (
    <div className="flex gap-3 rounded-xl border border-[#334155] bg-[#0F172A]/50 p-4 transition-all duration-200 hover:bg-[#0F172A]/70">
      <div className="shrink-0 pt-0.5">
        {ok ? (
          <CheckCircle2 className="h-5 w-5 text-[#22C55E]" aria-hidden />
        ) : (
          <XCircle className="h-5 w-5 text-[#EF4444]" aria-hidden />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm font-medium text-[#E2E8F0]">{label}</span>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
              ok
                ? "bg-[#22C55E]/15 text-[#86EFAC]"
                : "bg-[#EF4444]/15 text-[#FCA5A5]"
            }`}
          >
            <span className="mr-1" aria-hidden>
              {statusEmoji}
            </span>
            {statusText}
          </span>
        </div>
        {detail ? (
          <p className="mt-1.5 text-xs leading-relaxed text-[#94A3B8]">
            {detail}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export default Dashboard;
