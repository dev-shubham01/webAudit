/**
 * Build the internal link graph from crawled pages. Nodes are page URLs;
 * edges are internal (same-origin) links found on each page. Used for
 * orphan-page detection (Link Health category) and inbound-link-based
 * page ranking (Overview's Top Pages).
 */
export function buildEdges(pages) {
  const edges = [];
  for (const page of pages) {
    const from = page.finalUrl || page.url;
    for (const to of page.pageAnalysis?.internalLinks || []) {
      edges.push([from, to]);
    }
  }
  return edges;
}

export function computeInDegree(edges) {
  const inDegree = new Map();
  for (const [, to] of edges) {
    inDegree.set(to, (inDegree.get(to) || 0) + 1);
  }
  return inDegree;
}
