export function normalizeAndValidateUrl(rawUrl) {
  if (typeof rawUrl !== "string") return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const parsed = new URL(withProtocol);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return null;
    }
    return parsed.toString();
  } catch (_error) {
    return null;
  }
}

const IGNORED_LINK_SCHEMES = /^(mailto|javascript|tel|data):/i;

/**
 * Resolve href against base, strip fragment, and drop non-http(s)/unparsable
 * links. Mirrors the reference crawler's normalize_link().
 */
export function normalizeLink(base, href) {
  if (!href) return null;
  const trimmed = href.trim();
  if (!trimmed || IGNORED_LINK_SCHEMES.test(trimmed)) return null;

  try {
    const resolved = new URL(trimmed, base);
    resolved.hash = "";
    if (!["http:", "https:"].includes(resolved.protocol)) return null;
    const asString = resolved.toString();
    // Unconditional trailing-slash strip (matches the reference's
    // normalize_link, which does joined.rstrip("/") with no root special-case)
    // so a discovered link back to the homepage dedupes with the start URL.
    return asString.endsWith("/") ? asString.slice(0, -1) : asString;
  } catch {
    return null;
  }
}

/** Normalize a start URL the same way discovered links are normalized. */
export function normalizeStartUrl(url) {
  return normalizeLink(url, url) || url;
}

export function sameOrigin(a, b) {
  try {
    return new URL(a).host === new URL(b).host;
  } catch {
    return false;
  }
}
