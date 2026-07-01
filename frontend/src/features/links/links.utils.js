// Matches the reference's Links.jsx filter set exactly: four independent
// filters (inlinks / status / response time / word count) combined with AND,
// rather than a single set of mutually-exclusive chips.

export const INLINKS_FILTERS = [
  { id: "all", label: "All pages", test: () => true },
  { id: "orphans", label: "Orphans (0 inlinks)", test: (p) => p.inlinksCount === 0 },
];

export const STATUS_FILTERS = [
  { id: "all", label: "All Status Codes", test: () => true },
  { id: "200", label: "200 OK", test: (p) => p.status === 200 },
  { id: "404", label: "404 Not Found", test: (p) => p.status === 404 },
  { id: "301", label: "301 Redirect", test: (p) => p.status === 301 },
  { id: "302", label: "302 Redirect", test: (p) => p.status === 302 },
];

export const RESPONSE_TIME_FILTERS = [
  { id: "all", label: "All Response Times", test: () => true },
  { id: "fast", label: "Fast (<500ms)", test: (p) => (p.responseTimeMs || 0) < 500 },
  { id: "slow", label: "Slow (>2s)", test: (p) => (p.responseTimeMs || 0) > 2000 },
];

export const WORD_COUNT_FILTERS = [
  { id: "all", label: "All Word Counts", test: () => true },
  { id: "thin", label: "Thin (<300)", test: (p) => p.wordCount < 300 },
  { id: "medium", label: "Medium (300–1000)", test: (p) => p.wordCount >= 300 && p.wordCount <= 1000 },
  { id: "long", label: "Long (1000+)", test: (p) => p.wordCount > 1000 },
];

export const INSPECTOR_TABS = ["Overview", "Page analysis", "SEO & Social", "Content", "Technical", "Issues"];
