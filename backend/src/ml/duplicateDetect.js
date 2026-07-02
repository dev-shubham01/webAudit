function hammingDistance(hexA, hexB) {
  let xor = BigInt(`0x${hexA || "0"}`) ^ BigInt(`0x${hexB || "0"}`);
  let count = 0;
  while (xor > 0n) {
    count += Number(xor & 1n);
    xor >>= 1n;
  }
  return count;
}

// Near-duplicate if <=3 of the 64 SimHash bits differ.
const HAMMING_THRESHOLD = 3;
// Below this, a page's fingerprint is too noisy (mostly boilerplate) to compare reliably.
const MIN_WORD_COUNT = 20;

/**
 * Group crawled pages into near-duplicate clusters via SimHash Hamming
 * distance + union-find. Faithful port of the reference's SimHash-based
 * dedup (ml/enrich.py) — this is a hashing algorithm, not an ML model.
 * O(n²) pairwise comparison, fine at this tool's per-crawl page scale.
 */
export function groupDuplicates(pages) {
  const candidates = pages.filter((p) => p.seo?.contentFingerprint && (p.seo.wordCount || 0) > MIN_WORD_COUNT);
  const parent = new Map(candidates.map((p) => [p.url, p.url]));

  function find(x) {
    while (parent.get(x) !== x) {
      parent.set(x, parent.get(parent.get(x)));
      x = parent.get(x);
    }
    return x;
  }
  function union(a, b) {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent.set(ra, rb);
  }

  for (let i = 0; i < candidates.length; i += 1) {
    for (let j = i + 1; j < candidates.length; j += 1) {
      if (hammingDistance(candidates[i].seo.contentFingerprint, candidates[j].seo.contentFingerprint) <= HAMMING_THRESHOLD) {
        union(candidates[i].url, candidates[j].url);
      }
    }
  }

  const groups = new Map();
  for (const p of candidates) {
    const root = find(p.url);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root).push(p.url);
  }

  return [...groups.values()]
    .filter((urls) => urls.length > 1)
    .map((urls, i) => ({
      id: `dup-${i + 1}`,
      representativeUrl: urls[0],
      memberUrls: urls,
      memberCount: urls.length,
    }));
}
