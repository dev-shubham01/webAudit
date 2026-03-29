import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useScan } from "../../context/ScanContext.jsx";
import { generateInsights } from "../../utils/generateInsights.js";
import DashboardHeader from "./DashboardHeader";
import ErrorsSection from "./ErrorsSection";
import HeroScoreSection from "./HeroScoreSection";
import InsightsSection from "./InsightsSection";
import KpiSection from "./KpiSection";
import LinksSection from "./LinksSection";
import NoScanState from "./NoScanState";
import PerformanceMetricsSection from "./PerformanceMetricsSection";
import RecentScansSection from "./RecentScansSection";
import { AdvancedSeoSection, SeoSnapshotSection } from "./SeoSections";
import WebsitePreviewSection from "./WebsitePreviewSection";
import { truncate } from "./dashboard.utils";

export default function DashboardScreen() {
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
    return <NoScanState onStartScan={() => navigate("/")} />;
  }

  const score = scanResult.score;
  const breakdown = score?.breakdown;
  const seo = scanResult.seo;
  const performance = scanResult.performance;
  const consoleErrors = Array.isArray(scanResult.consoleErrors) ? scanResult.consoleErrors : [];
  const networkErrors = Array.isArray(scanResult.networkErrors) ? scanResult.networkErrors : [];
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
  const perfScore = breakdown?.performance ?? performance?.performanceScore ?? 0;
  const seoScore = breakdown?.seo ?? 0;
  const stabilityScore = breakdown?.errors ?? 0;

  const insights = generateInsights({
    seo,
    performance,
    consoleErrors,
    networkErrors,
    links,
    isBlocked: scanResult?.isBlocked === true,
  });

  const hasRealTitle =
    typeof seo?.title === "string" && seo.title.trim() !== "" && seo.title !== "Missing";
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
  const canonicalValue = typeof seo?.canonical === "string" ? seo.canonical.trim() : "";
  const canonicalPresent = canonicalValue !== "" && canonicalValue !== "Missing";
  const ogTitleValue =
    typeof seo?.openGraph?.title === "string" ? seo.openGraph.title.trim() : "";
  const ogDescriptionValue =
    typeof seo?.openGraph?.description === "string" ? seo.openGraph.description.trim() : "";
  const ogImageValue =
    typeof seo?.openGraph?.image === "string" ? seo.openGraph.image.trim() : "";
  const ogTitlePresent = ogTitleValue !== "" && ogTitleValue !== "Missing";
  const ogDescriptionPresent = ogDescriptionValue !== "" && ogDescriptionValue !== "Missing";
  const ogImagePresent = ogImageValue !== "" && ogImageValue !== "Missing";

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
      severity: String(err).length > 200 || consoleErrors.length >= 5 ? "high" : "medium",
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

  return (
    <div className="space-y-8 pb-8">
      <DashboardHeader onScanAnother={() => navigate("/")} />

      <div ref={resultsAnchorRef} className="scroll-mt-6 space-y-8">
        <HeroScoreSection overallScore={overallScore} scoreLabel={score?.label} />
        <WebsitePreviewSection screenshot={scanResult?.screenshot} />
        <KpiSection perfScore={perfScore} seoScore={seoScore} stabilityScore={stabilityScore} />
        <InsightsSection insights={insights} />
        <SeoSnapshotSection
          data={{
            hasRealTitle,
            hasRealMeta,
            h1OkSingle,
            h1Count,
            h1Present,
            totalImages,
            altOk,
            missingAlt,
            title: seo?.title,
            metaDescription: seo?.metaDescription,
            truncate,
          }}
        />
        <AdvancedSeoSection
          data={{
            canonicalPresent,
            canonicalValue,
            ogTitlePresent,
            ogTitleValue,
            ogDescriptionPresent,
            ogDescriptionValue,
            ogImagePresent,
            ogImageValue,
            truncate,
          }}
        />
        <ErrorsSection errorItems={errorItems} />
        <LinksSection
          totalLinksCount={totalLinksCount}
          brokenLinksCount={brokenLinksCount}
          successLinksCount={successLinksCount}
          brokenLinks={brokenLinks}
        />
        <PerformanceMetricsSection
          fcp={performance?.metrics?.fcp}
          lcp={performance?.metrics?.lcp}
          cls={performance?.metrics?.cls}
        />
        <RecentScansSection
          host={host}
          overallScore={overallScore}
          scoreLabel={score?.label}
          dateLabel={dateLabel}
        />
      </div>
    </div>
  );
}
