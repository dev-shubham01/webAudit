const MAX_IMAGES_TO_PROCESS = 30;
const LARGE_IMAGE_BYTES = 500 * 1024;
const VERY_LARGE_IMAGE_BYTES = 1024 * 1024;
const REQUEST_TIMEOUT_MS = 8000;

const getImagesFallback = () => ({
  totalImages: 0,
  largeImages: [],
  oversizedCount: 0,
});

const isValidImageSrc = (src) => {
  if (typeof src !== "string") {
    return false;
  }

  const value = src.trim();
  if (!value) {
    return false;
  }

  const lower = value.toLowerCase();
  if (lower.startsWith("data:") || lower.includes("base64,")) {
    return false;
  }

  return true;
};

const requestWithTimeout = async (url, method) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  try {
    return await fetch(url, {
      method,
      redirect: "follow",
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
};

const getContentLengthFromResponse = (response) => {
  const rawValue = response?.headers?.get?.("content-length");
  if (!rawValue) {
    return null;
  }

  const value = Number(rawValue);
  if (!Number.isFinite(value) || value <= 0) {
    return null;
  }

  return Math.floor(value);
};

const getImageSizeInBytes = async (url) => {
  try {
    const headResponse = await requestWithTimeout(url, "HEAD");
    const headContentLength = getContentLengthFromResponse(headResponse);
    if (headContentLength !== null) {
      return headContentLength;
    }

    const getResponse = await requestWithTimeout(url, "GET");
    return getContentLengthFromResponse(getResponse);
  } catch (error) {
    void error;
    return null;
  }
};

const extractImagesFromPage = async (page) => {
  return page.evaluate(() => {
    try {
      const imageElements = Array.from(document.querySelectorAll("img") || []);
      return imageElements.map((img) => ({
        src: img?.currentSrc || img?.src || img?.getAttribute?.("src") || "",
        naturalWidth: Number(img?.naturalWidth) || 0,
        naturalHeight: Number(img?.naturalHeight) || 0,
      }));
    } catch (error) {
      void error;
      return [];
    }
  });
};

export async function analyzeImages(page) {
  try {
    if (!page || typeof page.evaluate !== "function") {
      return getImagesFallback();
    }

    const extractedImages = await extractImagesFromPage(page);
    const validImages = extractedImages.filter((img) => isValidImageSrc(img?.src));
    const imagesToProcess = validImages.slice(0, MAX_IMAGES_TO_PROCESS);

    const sizeResults = await Promise.all(
      imagesToProcess.map(async (image) => {
        const size = await getImageSizeInBytes(image.src);
        if (size === null) {
          return null;
        }

        if (size <= LARGE_IMAGE_BYTES) {
          return null;
        }

        return {
          url: image.src,
          size,
          sizeKB: Number((size / 1024).toFixed(2)),
          isVeryLarge: size > VERY_LARGE_IMAGE_BYTES,
        };
      }),
    );

    const largeImages = sizeResults
      .filter((item) => item !== null)
      .map((item) => ({
        url: item.url,
        size: item.size,
        sizeKB: item.sizeKB,
      }));

    return {
      totalImages: validImages.length,
      largeImages,
      oversizedCount: largeImages.length,
    };
  } catch (error) {
    void error;
    return getImagesFallback();
  }
}
