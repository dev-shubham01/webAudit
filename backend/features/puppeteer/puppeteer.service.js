import puppeteer from "puppeteer";
import { analyzeSEO } from "../seo/seo.service.js";

const GOTO_TIMEOUT_MS = 30000;
const BODY_WAIT_MS = 10000;
const POST_LOAD_WAIT_MS = 3000;
const POST_SCROLL_WAIT_MS = 2000;

const getPuppeteerFallback = () => ({
  screenshot: null,
  consoleErrors: [],
  networkErrors: [],
  seo: null,
});

/** Puppeteer 21+ removed `page.waitForTimeout`; keep explicit delays for render accuracy */
function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

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

    await page.setViewport({
      width: 1440,
      height: 900,
    });

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
        timeout: GOTO_TIMEOUT_MS,
      });
    } catch (navigationError) {
      console.error("Navigation failed:", navigationError);
      return getPuppeteerFallback();
    }

    await page.waitForSelector("body", { timeout: BODY_WAIT_MS }).catch(() => {});
    if (typeof page.waitForTimeout === "function") {
      await page.waitForTimeout(POST_LOAD_WAIT_MS);
    } else {
      await delay(POST_LOAD_WAIT_MS);
    }

    const title = await page.title();
    console.log("Page title:", title);
    if (!title || !title.trim()) {
      console.log("Page not loaded properly");
    }

    await page.evaluate(async () => {
      await new Promise((resolve) => {
        let totalHeight = 0;
        const distance = 200;
        const timer = setInterval(() => {
          window.scrollBy(0, distance);
          totalHeight += distance;

          if (totalHeight >= document.body.scrollHeight) {
            clearInterval(timer);
            resolve();
          }
        }, 100);
      });
    });

    await delay(POST_SCROLL_WAIT_MS);

    await page.evaluate(() => {
      document.body.classList.add("puppeteer-ready");
    });

    seo = await analyzeSEO(page);

    try {
      const buffer = await page.screenshot({
        type: "png",
        fullPage: true,
      });
      screenshot = buffer.toString("base64");
      console.log("Screenshot captured:", screenshot.length);
    } catch (screenshotError) {
      console.error("Screenshot failed:", screenshotError?.message);
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
