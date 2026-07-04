import { useEffect, useMemo, useRef, useState, useDeferredValue } from "react";
import ForceGraph3D from "3d-force-graph";
import { Maximize, Minimize, Search } from "lucide-react";
import Input from "../../components/ui/input";
import Button from "../../components/ui/button";

/** Fewer simulation ticks + faster decay for large graphs (less CPU / quicker settle). */
function applyGraphPhysics(graph, nodeCount, linkCount) {
  if (nodeCount > 900 || linkCount > 4000) {
    graph.warmupTicks(0).cooldownTicks(70).d3AlphaDecay(0.03).d3VelocityDecay(0.42);
  } else if (nodeCount > 400 || linkCount > 1500) {
    graph.warmupTicks(2).cooldownTicks(110).d3AlphaDecay(0.026).d3VelocityDecay(0.38);
  } else if (nodeCount > 150) {
    graph.cooldownTicks(180).d3AlphaDecay(0.023).d3VelocityDecay(0.35);
  }
}

function pathLabel(url) {
  return String(url).replace(/^https?:\/\/[^/]+/, "") || "/";
}

export default function NetworkScreen({ report }) {
  const { data } = report;
  const containerRef = useRef(null);
  const wrapperRef = useRef(null);
  const graphRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearch = useDeferredValue(searchQuery);

  const graphPayload = useMemo(() => {
    const q = (deferredSearch || "").toLowerCase().trim();
    const urlToStatus = {};
    for (const l of data.links || []) urlToStatus[l.url] = String(l.status);

    const nodes = data.graphNodes || [];
    const edges = data.graphEdges || [];
    if (!nodes.length && !edges.length) return null;

    const nodeMap = new Map();
    const colorFor = (id) => {
      const st = urlToStatus[id] || "";
      return /^[45]/.test(st) ? "#EF4444" : /^2/.test(st) ? "#3B82F6" : "#64748b";
    };
    for (const id of nodes) {
      nodeMap.set(id, { id, label: pathLabel(id), title: id, color: colorFor(id) });
    }
    for (const { from, to } of edges) {
      if (from && !nodeMap.has(from)) nodeMap.set(from, { id: from, label: pathLabel(from), title: from, color: colorFor(from) });
      if (to && !nodeMap.has(to)) nodeMap.set(to, { id: to, label: pathLabel(to), title: to, color: colorFor(to) });
    }

    let ids = [...nodeMap.keys()];
    if (q) ids = ids.filter((id) => String(id).toLowerCase().includes(q));
    const idSet = new Set(ids);

    const graphNodes = ids.map((id) => nodeMap.get(id));
    const graphLinks = edges
      .map(({ from, to }) => (from && to && idSet.has(from) && idSet.has(to) ? { source: from, target: to } : null))
      .filter(Boolean);

    return { nodes: graphNodes, links: graphLinks, searchActive: !!q, totalNodeCount: nodeMap.size };
  }, [data, deferredSearch]);

  useEffect(() => {
    const prev = graphRef.current;
    if (prev) {
      try {
        prev._destructor();
      } catch {
        /* ignore */
      }
      graphRef.current = null;
    }

    if (!containerRef.current || !graphPayload || graphPayload.nodes.length === 0) return undefined;

    const el = containerRef.current;
    const graph = ForceGraph3D()(el)
      .graphData({ nodes: graphPayload.nodes, links: graphPayload.links })
      .nodeColor((node) => node.color)
      .nodeLabel((node) => node.title || node.id)
      .linkColor(() => "rgba(148, 163, 184, 0.3)")
      .onNodeClick((node) => node?.id && window.open(node.id, "_blank"))
      .backgroundColor("#05080f")
      .showNavInfo(false);

    applyGraphPhysics(graph, graphPayload.nodes.length, graphPayload.links.length);

    const w0 = el.offsetWidth;
    const h0 = el.offsetHeight;
    if (w0 && h0) graph.width(w0).height(h0);

    graphRef.current = graph;

    const ro = new ResizeObserver(() => {
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      if (w && h) graph.width(w).height(h);
    });
    ro.observe(el);

    const onVisibility = () => {
      if (document.hidden) graph.pauseAnimation();
      else graph.resumeAnimation();
    };
    document.addEventListener("visibilitychange", onVisibility);
    onVisibility();

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      ro.disconnect();
      try {
        graph._destructor();
      } catch {
        /* ignore */
      }
      graphRef.current = null;
    };
  }, [graphPayload]);

  const toggleFullscreen = () => {
    const el = wrapperRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  useEffect(() => {
    const onFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const hasGraph = (data.graphNodes?.length || 0) > 0 || (data.graphEdges?.length || 0) > 0;
  const searchEmpty = graphPayload?.searchActive && graphPayload.nodes.length === 0 && graphPayload.totalNodeCount > 0;

  return (
    <div className="flex h-full flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Internal Linking Map</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Physics-based graph of internal link structure. Red nodes indicate 4xx/5xx errors.
          </p>
        </div>
        {hasGraph && (
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search pages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-full rounded-lg border border-border bg-card pl-9 text-sm text-foreground placeholder:text-muted-foreground focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1]"
            />
          </div>
        )}
      </div>

      <div ref={wrapperRef} className="flex min-h-[80vh] flex-1 flex-col">
        <div className="relative min-h-[80vh] flex-1 overflow-hidden rounded-xl border border-border bg-card shadow-lg">
          {hasGraph ? (
            <>
              <div ref={containerRef} className="absolute inset-0 h-full w-full bg-[#05080f]" style={{ outline: "none" }} />
              {searchEmpty && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#05080f]/90 px-6 text-center text-sm text-muted-foreground">
                  No pages match your search.
                </div>
              )}
              <div className="absolute left-4 top-4 z-10 space-y-2 rounded-xl border border-border bg-background p-3 text-xs">
                <div className="flex items-center gap-2 text-foreground">
                  <div className="h-3 w-3 rounded-full border border-blue-400 bg-blue-500" />
                  OK (2xx)
                </div>
                <div className="flex items-center gap-2 text-foreground">
                  <div className="h-3 w-3 rounded-full border border-red-400 bg-red-500" />
                  Broken (4xx/5xx)
                </div>
                <div className="flex items-center gap-2 text-foreground">
                  <div className="h-0.5 w-4 bg-border" />
                  Internal Link
                </div>
              </div>
              <Button
                variant="secondary"
                onClick={toggleFullscreen}
                title={isFullscreen ? "Exit full screen" : "Full screen"}
                className="absolute right-4 top-4 z-10 flex items-center gap-2 border border-border bg-background text-foreground hover:bg-card"
              >
                {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                {isFullscreen ? "Exit full screen" : "Full screen"}
              </Button>
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center p-5 text-muted-foreground">
              No edge data available.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
