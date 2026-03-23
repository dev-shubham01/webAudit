import puppeteer from "puppeteer";
import { analyzeSEO } from "../seo/seo.service.js";

const NAVIGATION_TIMEOUT_MS = 30000;
const DOM_WAIT_TIMEOUT_MS = 10000;
const EXTRA_WAIT_MS = 3000;

const getPuppeteerFallback = () => ({
  screenshot: null,
  consoleErrors: [],
  networkErrors: [],
  seo: null,
});

export async function runPuppeteerScan(url) {
  const consoleErrors = [];
  const networkErrors = [];
  let seo = null;
  let screenshot = null;
  let browser;
  const normalizedUrl =
    typeof url === "string" && /^https?:\/\//i.test(url.trim())
      ? url.trim()
      : `https://${String(url || "").trim()}`;

  console.log("Scanning URL:", normalizedUrl);

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    page.on("response", (response) => {
      try {
        if (response.status() >= 400) {
          networkErrors.push({
            url: response.url(),
            status: response.status(),
          });
        }
      } catch (responseError) {
        void responseError;
      }
    });

    try {
      await page.goto(normalizedUrl, {
        waitUntil: "domcontentloaded",
        timeout: NAVIGATION_TIMEOUT_MS,
      });
    } catch (navigationError) {
      console.error("Navigation failed:", navigationError);
      return getPuppeteerFallback();
    }
    await page.waitForSelector("body", { timeout: DOM_WAIT_TIMEOUT_MS }).catch(() => {});
    if (typeof page.waitForTimeout === "function") {
      await page.waitForTimeout(EXTRA_WAIT_MS);
    } else {
      await new Promise((resolve) => setTimeout(resolve, EXTRA_WAIT_MS));
    }

    const title = await page.title();
    console.log("Page title:", title);
    if (!title || !title.trim()) {
      console.log("Page not loaded properly");
    }

    seo = await analyzeSEO(page);

    try {
      console.log("Taking screenshot...");
      screenshot = await page.screenshot({
        encoding: "base64",
        fullPage: true,
      });
    } catch (screenshotError) {
      console.error("Screenshot failed:", screenshotError);
      screenshot = null;
    }
  } catch (error) {
    console.error("Puppeteer scan failed:", error);
    return getPuppeteerFallback();
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error("Browser close failed:", closeError);
      }
    }
  }

  return {
    screenshot,
    consoleErrors,
    networkErrors,
    seo,
  };
}
