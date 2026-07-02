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

/**
 * Build the node/edge payload for the Network (3D force graph) view. Mirrors
 * the reference's cap to the top `maxNodes` nodes by degree count (its
 * `max_nodes_plot`, default 300) and its AND-filter-with-OR-fallback when the
 * AND filter would otherwise drop every edge.
 */
export function buildGraphPayload(pages, edges, { maxNodes = 300 } = {}) {
  const nodeSet = new Set();
  for (const page of pages) nodeSet.add(page.finalUrl || page.url);
  for (const [from, to] of edges) {
    nodeSet.add(from);
    nodeSet.add(to);
  }

  const degree = new Map();
  for (const [from, to] of edges) {
    degree.set(from, (degree.get(from) || 0) + 1);
    degree.set(to, (degree.get(to) || 0) + 1);
  }

  let nodes = [...nodeSet];
  if (nodes.length > maxNodes) {
    nodes = nodes
      .map((url) => ({ url, degree: degree.get(url) || 0 }))
      .sort((a, b) => b.degree - a.degree)
      .slice(0, maxNodes)
      .map((n) => n.url);
  }

  const nodeSetFinal = new Set(nodes);
  let filteredEdges = edges.filter(([from, to]) => nodeSetFinal.has(from) && nodeSetFinal.has(to));

  if (!filteredEdges.length && edges.length) {
    filteredEdges = edges.filter(([from, to]) => nodeSetFinal.has(from) || nodeSetFinal.has(to));
  }

  return {
    nodes,
    edges: filteredEdges.map(([from, to]) => ({ from, to })),
  };
}
