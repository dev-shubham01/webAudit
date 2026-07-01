import { normalizeLink } from "../utils/urls.js";

/** Extract page title and the set of absolute links from HTML. */
export function extractLinks($, pageUrl) {
  const title = ($("title").first().text() || "").trim();
  const links = new Set();

  $("a[href]").each((_, el) => {
    const link = normalizeLink(pageUrl, $(el).attr("href"));
    if (link) links.add(link);
  });

  return { title, links };
}
