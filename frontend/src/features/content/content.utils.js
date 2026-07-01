const TITLE_LEN_MIN = 30;
const TITLE_LEN_MAX = 60;
const META_DESC_LEN_MIN = 70;
const META_DESC_LEN_MAX = 160;
const THIN_CONTENT_WORDS = 300;

export const CONTENT_FILTERS = [
  { id: "all", label: "All pages", test: () => true },
  { id: "missingTitle", label: "Missing title", test: (p) => !p.title.trim() },
  {
    id: "titleShort",
    label: "Short title",
    test: (p) => p.title.trim().length > 0 && p.title.trim().length < TITLE_LEN_MIN,
  },
  { id: "titleLong", label: "Long title", test: (p) => p.title.trim().length > TITLE_LEN_MAX },
  { id: "missingMeta", label: "Missing meta description", test: (p) => !p.metaDescription.trim() },
  {
    id: "metaShort",
    label: "Short meta description",
    test: (p) => p.metaDescription.trim().length > 0 && p.metaDescriptionLen < META_DESC_LEN_MIN,
  },
  { id: "metaLong", label: "Long meta description", test: (p) => p.metaDescriptionLen > META_DESC_LEN_MAX },
  { id: "missingH1", label: "Missing H1", test: (p) => p.h1Count === 0 },
  { id: "multipleH1", label: "Multiple H1s", test: (p) => p.h1Count > 1 },
  {
    id: "thinContent",
    label: "Thin content",
    test: (p) => p.wordCount > 0 && p.wordCount < THIN_CONTENT_WORDS,
  },
  { id: "noindex", label: "Noindex", test: (p) => p.noindex },
];
