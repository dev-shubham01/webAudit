// ISO 639-3 (franc's output) -> readable label, common languages only.
const LANGUAGE_LABELS = {
  eng: "English",
  fra: "French",
  spa: "Spanish",
  deu: "German",
  ita: "Italian",
  por: "Portuguese",
  nld: "Dutch",
  rus: "Russian",
  jpn: "Japanese",
  cmn: "Chinese",
  kor: "Korean",
  ara: "Arabic",
  hin: "Hindi",
  pol: "Polish",
  swe: "Swedish",
  tur: "Turkish",
  vie: "Vietnamese",
};

/** Aggregate per-page detected language (franc-min) into a site-wide summary. */
export function summarizeLanguages(pages) {
  const counts = {};
  let detectedPages = 0;

  for (const p of pages) {
    const lang = p.seo?.language;
    if (!lang || lang === "und") continue;
    detectedPages += 1;
    const label = LANGUAGE_LABELS[lang] || lang;
    counts[label] = (counts[label] || 0) + 1;
  }

  return {
    mixedSite: Object.keys(counts).length > 1,
    detectedPages,
    counts,
  };
}
