/**
 * Site-wide config checks (robots.txt / sitemap.xml presence + validity),
 * used by the Technical SEO category and the Overview page's "Site Config" card.
 */
export async function checkSiteLevel(startUrl) {
  const origin = new URL(startUrl).origin;
  const [robotsPresent, sitemap] = await Promise.all([
    checkRobotsPresent(origin),
    checkSitemap(origin),
  ]);

  return {
    robotsPresent,
    sitemapPresent: sitemap.present,
    sitemapValid: sitemap.valid,
  };
}

async function checkRobotsPresent(origin) {
  try {
    const res = await fetch(`${origin}/robots.txt`, { method: "GET" });
    return res.ok;
  } catch {
    return false;
  }
}

async function checkSitemap(origin) {
  try {
    const res = await fetch(`${origin}/sitemap.xml`, { method: "GET" });
    if (!res.ok) return { present: false, valid: false };
    const text = await res.text();
    const valid = /<\?xml|<urlset|<sitemapindex/i.test(text.slice(0, 500));
    return { present: true, valid };
  } catch {
    return { present: false, valid: false };
  }
}
