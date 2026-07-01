import robotsParser from "robots-parser";

const DEFAULT_USER_AGENT = "WebHealthCrawler/1.0";

/**
 * Fetch and parse robots.txt for the start URL's origin. Returns a checker
 * with isAllowed(url); on any failure (missing/unreachable robots.txt),
 * everything is allowed — mirrors the reference's load_robots() behavior.
 */
export async function loadRobots(startUrl, userAgent = DEFAULT_USER_AGENT) {
  const robotsUrl = `${new URL(startUrl).origin}/robots.txt`;

  try {
    const res = await fetch(robotsUrl);
    if (!res.ok) return { isAllowed: () => true };
    const body = await res.text();
    const robots = robotsParser(robotsUrl, body);
    return { isAllowed: (url) => robots.isAllowed(url, userAgent) ?? true };
  } catch {
    return { isAllowed: () => true };
  }
}
