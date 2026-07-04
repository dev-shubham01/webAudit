import { useCallback, useEffect, useMemo, useState } from "react";
import { Images, ExternalLink, Grid3X3, LayoutGrid, Maximize2, X, Filter, Columns } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { HorizontalBarChartCard } from "../../components/charts/ChartCards.jsx";
import { collectFromLinks, KIND_LABELS } from "./gallery.utils.js";
import { PALETTE_CATEGORICAL } from "../../utils/chartPalette.js";

// Note: the reference virtualizes the grid with @tanstack/react-virtual for
// very large image libraries. That dependency isn't installed and, at this
// tool's crawl scale (tens of pages), a plain CSS grid renders every tile
// without a noticeable performance cost — so windowing is skipped here.
function GalleryTile({ item, onOpen, masonry }) {
  const [broken, setBroken] = useState(false);
  const primary = item.refs[0];
  const kinds = [...new Set(item.refs.map((r) => r.kind))];

  return (
    <button
      type="button"
      onClick={() => onOpen(item)}
      className={`group text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 ${
        masonry
          ? "mb-3 block w-full break-inside-avoid overflow-hidden rounded-xl border border-border bg-card/60"
          : "relative overflow-hidden rounded-xl border border-border bg-card/60"
      }`}
    >
      <div className="relative">
        <div className={masonry ? "bg-background-sunken" : "flex aspect-[4/3] items-center justify-center bg-background-sunken"}>
          {!broken ? (
            <img
              src={item.src}
              alt=""
              loading="lazy"
              decoding="async"
              className={
                masonry
                  ? "block h-auto w-full max-w-full transition-transform duration-300 group-hover:scale-[1.02]"
                  : "h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              }
              onError={() => setBroken(true)}
            />
          ) : (
            <div
              className={`p-4 text-center text-xs text-muted-foreground ${
                masonry ? "flex min-h-[100px] flex-col items-center justify-center" : ""
              }`}
            >
              Preview unavailable
              <div className="mt-2 line-clamp-4 break-all font-mono text-[10px] opacity-70">{item.src}</div>
            </div>
          )}
        </div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
        <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 transition-opacity group-hover:opacity-100">
          <div className="flex items-center gap-1 truncate text-[10px] font-medium text-white/90">
            <Maximize2 className="h-3 w-3 shrink-0" />
            <span className="truncate">{primary?.pageUrl || "—"}</span>
          </div>
          <div className="mt-1 flex flex-wrap gap-1">
            {kinds.map((k) => (
              <span key={k} className="rounded bg-white/15 px-1.5 py-0.5 text-[9px] text-white/95">
                {KIND_LABELS[k] || k}
              </span>
            ))}
          </div>
        </div>
      </div>
    </button>
  );
}

export default function GalleryScreen({ report }) {
  const { links } = report.data;
  const [density, setDensity] = useState("md");
  const [layoutMode, setLayoutMode] = useState("grid");
  const [kindFilter, setKindFilter] = useState("all");
  const [lightbox, setLightbox] = useState(null);

  const items = useMemo(() => collectFromLinks(links), [links]);

  const kindBreakdown = useMemo(() => {
    let onPage = 0;
    let og = 0;
    let twitter = 0;
    items.forEach((item) => {
      const kinds = new Set(item.refs.map((r) => r.kind));
      if (kinds.has("content")) onPage += 1;
      if (kinds.has("og")) og += 1;
      if (kinds.has("twitter")) twitter += 1;
    });
    return [
      { name: "On-page", count: onPage, color: PALETTE_CATEGORICAL[0] },
      { name: "Open Graph", count: og, color: PALETTE_CATEGORICAL[1] },
      { name: "Twitter / X", count: twitter, color: PALETTE_CATEGORICAL[2] },
    ];
  }, [items]);

  const filtered = useMemo(
    () => items.filter((item) => kindFilter === "all" || item.refs.some((r) => r.kind === kindFilter)),
    [items, kindFilter],
  );

  const closeLightbox = useCallback(() => setLightbox(null), []);

  useEffect(() => {
    if (!lightbox) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => {
      if (e.key === "Escape") closeLightbox();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [lightbox, closeLightbox]);

  const gridColsClass =
    density === "sm"
      ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
      : density === "lg"
        ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4";

  const masonryColsClass =
    density === "sm"
      ? "columns-2 sm:columns-3 md:columns-4 lg:columns-5 xl:columns-6"
      : density === "lg"
        ? "columns-1 sm:columns-2 lg:columns-3"
        : "columns-2 sm:columns-3 lg:columns-4";

  return (
    <div className="space-y-8 pb-16">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Gallery</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Images discovered during the crawl: on-page assets, Open Graph, and Twitter images. Click any tile to
          enlarge.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <Filter className="h-3.5 w-3.5" /> Source
          </span>
          {[
            { id: "all", label: "All" },
            { id: "content", label: "On-page" },
            { id: "og", label: "OG" },
            { id: "twitter", label: "Twitter" },
          ].map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setKindFilter(id)}
              className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                kindFilter === id
                  ? "border-blue-500/40 bg-blue-500/15 text-[#93C5FD]"
                  : "border-border text-muted-foreground hover:bg-card hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Layout</span>
            <div className="flex overflow-hidden rounded-lg border border-border">
              <button
                type="button"
                title="Grid"
                onClick={() => setLayoutMode("grid")}
                className={`p-2 ${layoutMode === "grid" ? "bg-violet-500/20 text-violet-300" : "text-muted-foreground hover:bg-card"}`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                type="button"
                title="Masonry"
                onClick={() => setLayoutMode("masonry")}
                className={`border-l border-border p-2 ${
                  layoutMode === "masonry" ? "bg-violet-500/20 text-violet-300" : "text-muted-foreground hover:bg-card"
                }`}
              >
                <Columns className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Grid</span>
            <div className="flex overflow-hidden rounded-lg border border-border">
              <button
                type="button"
                title="Dense"
                onClick={() => setDensity("sm")}
                className={`p-2 ${density === "sm" ? "bg-blue-500/20 text-[#93C5FD]" : "text-muted-foreground hover:bg-card"}`}
              >
                <Grid3X3 className="h-4 w-4" />
              </button>
              <button
                type="button"
                title="Balanced"
                onClick={() => setDensity("md")}
                className={`border-l border-border p-2 ${
                  density === "md" ? "bg-blue-500/20 text-[#93C5FD]" : "text-muted-foreground hover:bg-card"
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                type="button"
                title="Large"
                onClick={() => setDensity("lg")}
                className={`border-l border-border p-2 ${
                  density === "lg" ? "bg-blue-500/20 text-[#93C5FD]" : "text-muted-foreground hover:bg-card"
                }`}
              >
                <Maximize2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {items.length > 0 && (
        <HorizontalBarChartCard title="By source type" data={kindBreakdown} yWidth={90} height={140} />
      )}

      <Card className="border-border bg-card">
        <CardContent className="flex flex-wrap gap-6 p-4 text-sm">
          <div>
            <div className="mb-0.5 text-xs uppercase tracking-wider text-muted-foreground">Unique images</div>
            <div className="text-2xl font-bold tabular-nums text-foreground">{items.length}</div>
          </div>
          <div>
            <div className="mb-0.5 text-xs uppercase tracking-wider text-muted-foreground">Shown (filtered)</div>
            <div className="text-2xl font-bold tabular-nums text-[#CBD5E1]">{filtered.length}</div>
          </div>
          <div className="max-w-xl text-xs leading-relaxed text-muted-foreground">
            Crawled pages with page-analysis image URLs populate most tiles. OG and Twitter images are merged in
            when present.
          </div>
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <Card className="border-border bg-card">
          <CardContent className="p-12 text-center">
            <Images className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">
              {items.length === 0
                ? "No images found. Re-run the crawler with page analysis enabled so image URLs are captured per page."
                : "No images match your filters."}
            </p>
          </CardContent>
        </Card>
      ) : layoutMode === "grid" ? (
        <div className={`grid gap-3 ${gridColsClass}`}>
          {filtered.map((item) => (
            <GalleryTile key={item.src} item={item} onOpen={setLightbox} masonry={false} />
          ))}
        </div>
      ) : (
        <div className={`${masonryColsClass} gap-3`}>
          {filtered.map((item) => (
            <GalleryTile key={item.src} item={item} onOpen={setLightbox} masonry />
          ))}
        </div>
      )}

      {lightbox && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label="Image preview"
          onClick={closeLightbox}
        >
          <button
            type="button"
            aria-label="Close"
            onClick={closeLightbox}
            className="absolute right-4 top-4 z-10 rounded-lg border border-border bg-card p-2 text-foreground hover:bg-[#263449]"
          >
            <X className="h-5 w-5" />
          </button>
          <div
            className="flex max-h-[min(88vh,900px)] max-w-[min(96vw,1200px)] flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex min-h-[200px] items-center justify-center overflow-hidden rounded-xl border border-border bg-background-sunken shadow-2xl">
              <img
                src={lightbox.src}
                alt=""
                className="h-auto max-h-[min(70vh,720px)] w-auto max-w-full object-contain"
              />
            </div>
            <Card className="border-border bg-card">
              <CardContent className="space-y-3 p-4">
                <a
                  href={lightbox.src}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-start gap-2 break-all font-mono text-sm text-link hover:underline"
                >
                  <ExternalLink className="mt-0.5 h-4 w-4 shrink-0" />
                  {lightbox.src}
                </a>
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Found on</div>
                <ul className="max-h-40 space-y-2 overflow-y-auto">
                  {lightbox.refs.map((r, i) => (
                    <li key={`${r.pageUrl}-${r.kind}-${i}`} className="flex flex-wrap items-center gap-2 text-sm">
                      <a
                        href={r.pageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="max-w-full truncate text-link hover:underline sm:max-w-md"
                      >
                        {r.pageUrl}
                      </a>
                      <span className="rounded-full border border-border bg-card px-2 py-0.5 text-[10px] text-muted-foreground">
                        {KIND_LABELS[r.kind] || r.kind}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
