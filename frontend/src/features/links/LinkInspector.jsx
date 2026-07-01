import { useState } from "react";
import { X } from "lucide-react";
import { Badge } from "../../components/ui/badge";
import { INSPECTOR_TABS } from "./links.utils.js";

const TITLE_LEN_MIN = 30;
const TITLE_LEN_MAX = 60;
const META_DESC_LEN_MIN = 70;
const META_DESC_LEN_MAX = 160;

function Field({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[#334155]/50 py-2 text-sm">
      <span className="shrink-0 text-[#94A3B8]">{label}</span>
      <span className="max-w-[70%] break-words text-right text-[#E2E8F0]">
        {value === "" || value === null || value === undefined ? (
          <span className="text-[#64748B]">—</span>
        ) : typeof value === "boolean" ? (
          <Badge variant={value ? "outline" : "destructive"}>{value ? "Yes" : "No"}</Badge>
        ) : (
          String(value)
        )}
      </span>
    </div>
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

function severityVariant(severity) {
  if (severity === "high") return "destructive";
  if (severity === "medium") return "secondary";
  return "outline";
}

export default function LinkInspector({ page, onClose }) {
  const [tab, setTab] = useState(INSPECTOR_TABS[0]);

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4">
      <div className="flex max-h-[85vh] w-full max-w-3xl flex-col rounded-xl border border-[#334155] bg-[#0F172A]">
        <div className="flex items-start justify-between border-b border-[#334155] p-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-[#E2E8F0]">{page.url}</p>
            <p className="text-xs text-[#64748B]">Status {page.status} · Depth {page.depth}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-md p-1 text-[#94A3B8] hover:bg-[#1E293B]">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-wrap gap-1 border-b border-[#334155] px-4 pt-2">
          {INSPECTOR_TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`rounded-t-md px-3 py-2 text-xs font-medium ${
                tab === t
                  ? "border-b-2 border-[#6366F1] text-[#6366F1]"
                  : "text-[#94A3B8] hover:text-[#E2E8F0]"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
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
              <div className="flex items-start justify-between gap-4 border-b border-[#334155]/50 py-2 text-sm">
                <span className="shrink-0 text-[#94A3B8]">Title</span>
                <span className="flex max-w-[70%] items-center gap-2 text-right text-[#E2E8F0]">
                  <span className="truncate">{page.title || "Missing"}</span>
                  <Badge variant={lengthVariant(page.title?.length || 0, TITLE_LEN_MIN, TITLE_LEN_MAX)}>
                    {page.title?.length || 0}
                  </Badge>
                </span>
              </div>
              <div className="flex items-start justify-between gap-4 border-b border-[#334155]/50 py-2 text-sm">
                <span className="shrink-0 text-[#94A3B8]">Meta Description</span>
                <span className="flex max-w-[70%] items-center gap-2 text-right text-[#E2E8F0]">
                  <span className="truncate">{page.metaDescription || "Missing"}</span>
                  <Badge variant={lengthVariant(page.metaDescriptionLen, META_DESC_LEN_MIN, META_DESC_LEN_MAX)}>
                    {page.metaDescriptionLen}
                  </Badge>
                </span>
              </div>
              <div className="flex items-start justify-between gap-4 py-2 text-sm">
                <span className="shrink-0 text-[#94A3B8]">H1</span>
                <span className="flex items-center gap-2">
                  <Badge variant={h1Variant(page.h1Count)}>{page.h1Count}</Badge>
                  <span className="truncate text-[#E2E8F0]">{page.h1Text}</span>
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
                  <p className="mb-2 text-xs font-medium uppercase text-[#64748B]">Top keywords</p>
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
              {(page.warnings || []).length === 0 ? (
                <p className="text-sm text-[#94A3B8]">No warnings for this page.</p>
              ) : (
                page.warnings.map((w) => (
                  <div key={w.id} className="rounded-md border border-[#334155] p-3">
                    <div className="flex items-center gap-2">
                      <Badge variant={severityVariant(w.severity)}>{w.severity}</Badge>
                      <p className="text-sm text-[#E2E8F0]">{w.message}</p>
                    </div>
                    {w.detail && <p className="mt-1 text-xs text-[#94A3B8]">{w.detail}</p>}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
