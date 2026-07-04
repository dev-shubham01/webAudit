import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const MARGIN = 40;

function addHeading(doc, text, y) {
  doc.setFont(undefined, "bold");
  doc.setFontSize(13);
  doc.text(text, MARGIN, y);
  doc.setFont(undefined, "normal");
  doc.setFontSize(10);
  return y + 18;
}

function ensureSpace(doc, y, needed = 60) {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (y + needed > pageHeight - MARGIN) {
    doc.addPage();
    return MARGIN;
  }
  return y;
}

export function generateReportPdf(report) {
  const data = report.data;
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  doc.setFont(undefined, "bold");
  doc.setFontSize(18);
  doc.text("Website Health Report", MARGIN, 50);

  doc.setFont(undefined, "normal");
  doc.setFontSize(10);
  doc.text(`${data.siteName}  —  ${data.url}`, MARGIN, 70);
  doc.text(`Generated ${new Date(data.generatedAt).toLocaleString()}`, MARGIN, 85);

  let y = 115;

  // Summary
  y = addHeading(doc, "Summary", y);
  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    theme: "grid",
    styles: { fontSize: 9 },
    head: [["Total URLs", "Success Rate", "2xx / 3xx / 4xx / 5xx", "Crawl Time"]],
    body: [[
      data.summary.totalUrls,
      `${data.summary.successRate}%`,
      `${data.summary.count2xx} / ${data.summary.count3xx} / ${data.summary.count4xx} / ${data.summary.count5xx}`,
      `${data.summary.crawlTimeS}s`,
    ]],
  });
  y = doc.lastAutoTable.finalY + 25;

  // KPIs
  y = ensureSpace(doc, y, 100);
  y = addHeading(doc, "Key Metrics", y);
  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    theme: "grid",
    styles: { fontSize: 9 },
    head: [["Metric", "Value"]],
    body: [
      ["Broken links (4xx/5xx)", data.kpis.brokenLinks],
      ["Missing H1s", data.kpis.missingH1],
      ["Median word count", data.kpis.medianWordCount],
      ["OG tag coverage", `${data.kpis.ogCoveragePct}%`],
      ["Technologies detected", data.kpis.techCount],
      ["Response time (p50 / p95)", `${data.kpis.responseTimeP50}ms / ${data.kpis.responseTimeP95}ms`],
    ],
  });
  y = doc.lastAutoTable.finalY + 25;

  // Category scores
  y = ensureSpace(doc, y, 100);
  y = addHeading(doc, "Health by Category", y);
  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    theme: "grid",
    styles: { fontSize: 9 },
    head: [["Category", "Score", "Issues"]],
    body: (data.categories || []).map((c) => [c.name, c.score ?? "—", c.issues?.length ?? 0]),
  });
  y = doc.lastAutoTable.finalY + 25;

  // Top issues (capped to keep the PDF a reasonable length)
  const allIssues = (data.categories || []).flatMap((c) =>
    (c.issues || []).map((issue) => ({ ...issue, category: c.name })),
  );
  const priorityOrder = { Critical: 0, High: 1, Medium: 2, Low: 3 };
  const topIssues = [...allIssues]
    .sort((a, b) => (priorityOrder[a.priority] ?? 4) - (priorityOrder[b.priority] ?? 4))
    .slice(0, 40);

  if (topIssues.length > 0) {
    y = ensureSpace(doc, y, 100);
    y = addHeading(doc, `Top Issues (${topIssues.length} of ${allIssues.length})`, y);
    autoTable(doc, {
      startY: y,
      margin: { left: MARGIN, right: MARGIN },
      theme: "grid",
      styles: { fontSize: 8, cellWidth: "wrap", overflow: "linebreak" },
      columnStyles: {
        0: { cellWidth: 45 },
        1: { cellWidth: 65 },
        2: { cellWidth: 190 },
        3: { cellWidth: 205 },
      },
      head: [["Priority", "Category", "Issue", "Recommendation"]],
      body: topIssues.map((i) => [i.priority || "—", i.category, i.message || "—", i.recommendation || "—"]),
    });
    y = doc.lastAutoTable.finalY + 25;
  }

  // Site configuration
  y = ensureSpace(doc, y, 80);
  y = addHeading(doc, "Site Configuration", y);
  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    theme: "grid",
    styles: { fontSize: 9 },
    head: [["robots.txt", "sitemap.xml"]],
    body: [[
      data.siteConfig?.robotsPresent ? "Present" : "Missing",
      data.siteConfig?.sitemapPresent
        ? data.siteConfig?.sitemapValid
          ? "Present (valid XML)"
          : "Present (invalid XML)"
        : "Missing",
    ]],
  });
  y = doc.lastAutoTable.finalY + 25;

  // Recommendations
  if ((data.recommendations || []).length > 0) {
    y = ensureSpace(doc, y, 60);
    y = addHeading(doc, "Recommendations", y);
    doc.setFontSize(9);
    for (const rec of data.recommendations) {
      y = ensureSpace(doc, y, 20);
      const lines = doc.splitTextToSize(`• ${rec}`, doc.internal.pageSize.getWidth() - MARGIN * 2);
      doc.text(lines, MARGIN, y);
      y += lines.length * 12 + 4;
    }
  }

  const filename = `${data.siteName || "website"}-health-report.pdf`.replace(/[^a-z0-9.-]/gi, "_");
  doc.save(filename);
}
