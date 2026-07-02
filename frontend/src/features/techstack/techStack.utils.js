// Ported from the reference's views/TechStack.jsx TECH_CATEGORIES mapping.
export const TECH_CATEGORIES = {
  CMS: ["WordPress", "Drupal", "Joomla", "Shopify", "Squarespace", "Wix"],
  "JS Frameworks": ["React", "Next.js", "Vue.js", "Nuxt.js", "Angular", "Svelte", "Gatsby", "jQuery"],
  "CSS Frameworks": ["Bootstrap", "Tailwind CSS"],
  Analytics: ["Google Analytics", "Google Tag Manager", "Facebook Pixel", "Hotjar"],
  Infrastructure: ["Cloudflare", "Nginx", "Apache", "LiteSpeed", "Vercel", "Netlify", "Amazon CloudFront", "AWS"],
  Fonts: ["Google Fonts", "Font Awesome"],
};

export function categorizeTech(name) {
  for (const [cat, techs] of Object.entries(TECH_CATEGORIES)) {
    if (techs.includes(name)) return cat;
  }
  return "Other";
}

/** Aggregate per-page techStack arrays (already in report.data.links) into detection counts + sample URLs. */
export function buildTechSummary(links) {
  const byName = new Map();
  for (const link of links || []) {
    for (const name of link.techStack || []) {
      if (!byName.has(name)) byName.set(name, { name, count: 0, sampleUrls: [] });
      const entry = byName.get(name);
      entry.count += 1;
      if (entry.sampleUrls.length < 5) entry.sampleUrls.push(link.url);
    }
  }
  return [...byName.values()].sort((a, b) => b.count - a.count);
}
