import { useMemo, useState } from "react";
import { ArrowLeft, Copy, Check, ExternalLink } from "lucide-react";
import { Badge } from "../../components/ui/badge";
import { Card } from "../../components/ui/card";
import { INSPECTOR_TABS } from "./links.utils.js";

const TITLE_LEN_MIN = 30;
const TITLE_LEN_MAX = 60;
const META_DESC_LEN_MIN = 70;
const META_DESC_LEN_MAX = 160;

function Field({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/50 py-2 text-sm">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="max-w-[70%] break-words text-right text-foreground">
        {value === "" || value === null || value === undefined ? (
          <span className="text-muted-foreground">—</span>
        ) : typeof value === "boolean" ? (
          <Badge variant={value ? "outline" : "destructive"}>{value ? "Yes" : "No"}</Badge>
        ) : (
          String(value)
        )}
      </span>
    </div>
  );
}

function CharBar({ length, min, max }) {
  const pct = Math.min(100, (length / max) * 100);
  const color = length === 0 ? "bg-red-500" : length < min || length > max ? "bg-yellow-500" : "bg-green-500";
  return (
    <div className="mt-1 flex items-center gap-2">
      <div className="h-1.5 w-32 overflow-hidden rounded-full bg-border">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.max(2, pct)}%` }} />
      </div>
      <span className="text-xs text-muted-foreground">
        {length}/{max}
      </span>
    </div>
  );
}

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(text || "");
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      }}
      className="shrink-0 rounded p-1 text-muted-foreground hover:bg-card hover:text-foreground"
      title="Copy to clipboard"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

function lengthVariant(len, min, max) {
  if (len === 0) return "destructive";
  if (len < min || len > max) return "secondary";
  return "outline";
}

function h1Variant(count) {
  if (count === 0) return "destructive";
  if (count === 1) return "outline";
  return "secondary";
}

function useAllIssuesFor(page, report) {
  return useMemo(() => {
    const url = page.url;
    const items = [];
    for (const w of page.warnings || []) {
      items.push({ severity: w.severity || "info", message: w.message, detail: w.detail, source: "Page warning" });
    }
    for (const c of report.data.categories || []) {
      for (const issue of c.issues || []) {
        if (issue.url === url) {
          items.push({ severity: (issue.priority || "info").toLowerCase(), message: issue.message, detail: issue.recommendation, source: c.name });
        }
      }
    }
    for (const f of report.data.securityFindings || []) {
      if (f.url === url) {
        items.push({ severity: (f.severity || "info").toLowerCase(), message: f.message, detail: f.recommendation, source: "Security" });
      }
    }
    for (const b of report.data.brokenLinks || []) {
      if (b.url === url) {
        items.push({ severity: "high", message: `Broken link (status ${b.status})`, source: "Link health" });
      }
    }
    return items;
  }, [page, report]);
}

export default function LinkInspector({ page, report, onClose }) {
  const [tab, setTab] = useState(INSPECTOR_TABS[0]);
  const allIssues = useAllIssuesFor(page, report);

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onClose}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Explorer
      </button>

      <Card className="border-border bg-card">
        <div className="flex items-start justify-between gap-4 border-b border-border p-4">
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate rounded-md bg-background px-2 py-1 font-mono text-sm text-foreground">{page.url}</span>
            <CopyBtn text={page.url} />
            <a href={page.url} target="_blank" rel="noreferrer" className="shrink-0 text-muted-foreground hover:text-link">
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
          <p className="shrink-0 text-xs text-muted-foreground">
            Status {page.status} · Depth {page.depth}
          </p>
        </div>

        <div className="flex flex-wrap gap-1 border-b border-border px-4 pt-2">
          {INSPECTOR_TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`flex items-center gap-1.5 rounded-t-md px-3 py-2 text-xs font-medium ${
                tab === t
                  ? "border-b-2 border-[#6366F1] text-[#6366F1]"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
              {t === "Issues" && allIssues.length > 0 && (
                <span className="rounded-full bg-red-500/20 px-1.5 text-[10px] font-bold text-red-400">{allIssues.length}</span>
              )}
            </button>
          ))}
        </div>

        <div className="p-4">
          {tab === "Overview" && (
            <div>
              <Field label="Status" value={page.status} />
              <Field label="Response Time" value={page.responseTimeMs ? `${page.responseTimeMs}ms` : null} />
              <Field label="Depth" value={page.depth} />
              <Field label="Inlinks" value={page.inlinksCount} />
              <Field label="Outlinks" value={page.outlinksCount} />
              <Field label="Words" value={page.wordCount} />
              <Field label="Reading Level" value={page.readingLevel ? `Grade ${page.readingLevel}` : null} />
              <Field label="Redirects" value={page.redirectChainLength} />
              <Field label="Content-Type" value={page.contentType} />
              <div className="border-b border-border/50 py-2 text-sm">
                <div className="flex items-start justify-between gap-4">
                  <span className="shrink-0 text-muted-foreground">Title</span>
                  <span className="flex max-w-[70%] items-center gap-2 text-right text-foreground">
                    <span className="truncate">{page.title || "Missing"}</span>
                    <CopyBtn text={page.title} />
                  </span>
                </div>
                <div className="flex justify-end">
                  <CharBar length={page.title?.length || 0} min={TITLE_LEN_MIN} max={TITLE_LEN_MAX} />
                </div>
              </div>
              <div className="border-b border-border/50 py-2 text-sm">
                <div className="flex items-start justify-between gap-4">
                  <span className="shrink-0 text-muted-foreground">Meta Description</span>
                  <span className="flex max-w-[70%] items-center gap-2 text-right text-foreground">
                    <span className="truncate">{page.metaDescription || "Missing"}</span>
                    <CopyBtn text={page.metaDescription} />
                  </span>
                </div>
                <div className="flex justify-end">
                  <CharBar length={page.metaDescriptionLen || 0} min={META_DESC_LEN_MIN} max={META_DESC_LEN_MAX} />
                </div>
              </div>
              <div className="flex items-start justify-between gap-4 py-2 text-sm">
                <span className="shrink-0 text-muted-foreground">H1</span>
                <span className="flex items-center gap-2">
                  <Badge variant={h1Variant(page.h1Count)}>{page.h1Count}</Badge>
                  <span className="truncate text-foreground">{page.h1Text}</span>
                </span>
              </div>
            </div>
          )}

          {tab === "Page analysis" && (
            <div>
              <Field label="Internal links" value={page.pageAnalysis?.internalLinkCount} />
              <Field label="External links" value={page.pageAnalysis?.externalLinkCount} />
              <Field label="HTML lang" value={page.pageAnalysis?.htmlLang} />
              <Field label="Hreflang alternates" value={page.pageAnalysis?.hreflangAlternates?.length} />
              <Field label="Preload hints" value={page.pageAnalysis?.preloadCount} />
              <Field label="Preconnect hints" value={page.pageAnalysis?.preconnectCount} />
              <Field label="Third-party scripts" value={page.pageAnalysis?.thirdPartyScriptCount} />
              <Field label="Script URLs" value={page.pageAnalysis?.scriptUrls?.length} />
              <Field label="Stylesheet URLs" value={page.pageAnalysis?.stylesheetUrls?.length} />
            </div>
          )}

          {tab === "SEO & Social" && (
            <div>
              <Field label="Canonical URL" value={page.canonicalUrl} />
              <Field label="Noindex" value={page.noindex} />
              <Field label="OG title" value={page.ogTitle} />
              <Field label="OG description" value={page.ogDescription} />
              <Field label="OG image" value={page.ogImage} />
              <Field label="Twitter card" value={page.twitterCard} />
            </div>
          )}

          {tab === "Content" && (
            <div>
              <Field label="Content/HTML ratio" value={page.contentHtmlRatio ? `${page.contentHtmlRatio}%` : null} />
              <Field label="Images total" value={page.imagesTotal} />
              <Field label="Images missing alt" value={page.imagesWithoutAlt} />
              {page.topKeywords?.length > 0 && (
                <div className="mt-3">
                  <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">Top keywords</p>
                  <div className="flex flex-wrap gap-2">
                    {page.topKeywords.map((kw) => (
                      <Badge key={kw.word} variant="outline">
                        {kw.word} ({kw.count})
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === "Technical" && (
            <div>
              <Field label="Viewport present" value={page.viewportPresent} />
              <Field label="Structured data (schema.org)" value={page.hasSchema} />
              <Field label="Technologies" value={(page.techStack || []).join(", ")} />
              <Field label="Cache-Control" value={page.headers?.cacheControl} />
              <Field label="ETag" value={page.headers?.etag} />
              <Field label="Strict-Transport-Security" value={page.headers?.strictTransportSecurity} />
              <Field label="X-Content-Type-Options" value={page.headers?.xContentTypeOptions} />
              <Field label="X-Frame-Options" value={page.headers?.xFrameOptions} />
              <Field label="Content-Security-Policy" value={page.headers?.contentSecurityPolicy} />
              <Field label="Server" value={page.headers?.server} />
            </div>
          )}

          {tab === "Issues" && (
            <div className="space-y-2">
              {allIssues.length === 0 ? (
                <p className="text-sm text-muted-foreground">No issues found for this page.</p>
              ) : (
                allIssues.map((w, idx) => (
                  <div key={idx} className="rounded-md border border-border p-3">
                    <div className="flex items-center gap-2">
                      <Badge value={w.severity} label={w.severity} />
                      <span className="text-xs uppercase text-muted-foreground">{w.source}</span>
                    </div>
                    <p className="mt-1 text-sm text-foreground">{w.message}</p>
                    {w.detail && <p className="mt-1 text-xs text-muted-foreground">{w.detail}</p>}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
