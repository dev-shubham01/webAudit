const getSeoFallback = () => ({
  title: "Missing",
  metaDescription: "Missing",
  h1: {
    count: 0,
    texts: [],
  },
  images: {
    total: 0,
    missingAlt: 0,
  },
  links: {
    total: 0,
  },
  canonical: "Missing",
  openGraph: {
    title: "Missing",
    description: "Missing",
    image: "Missing",
  },
});

const sanitizeText = (value) => {
  if (typeof value !== "string") {
    return "Missing";
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : "Missing";
};

const sanitizeCount = (value) => {
  if (!Number.isFinite(value) || value < 0) {
    return 0;
  }
  return Math.floor(value);
};

export async function analyzeSEO(page) {
  try {
    if (!page || typeof page.evaluate !== "function") {
      return getSeoFallback();
    }

    const seoData = await page.evaluate(() => {
      try {
        const normalizeText = (value) => {
          if (typeof value !== "string") {
            return "";
          }
          return value.trim();
        };

        const safeDocument = typeof document === "object" && document ? document : null;
        if (!safeDocument) {
          return {
            title: "Missing",
            metaDescription: "Missing",
            h1: { count: 0, texts: [] },
            images: { total: 0, missingAlt: 0 },
            links: { total: 0 },
            canonical: "Missing",
            openGraph: {
              title: "Missing",
              description: "Missing",
              image: "Missing",
            },
          };
        }

        const titleText = normalizeText(safeDocument.title || "");
        const metaDescriptionTag = safeDocument.querySelector('meta[name="description"]');
        const metaDescriptionText = normalizeText(
          metaDescriptionTag?.getAttribute("content") || "",
        );
        const canonicalTag = safeDocument.querySelector('link[rel="canonical"]');
        const canonicalText = normalizeText(canonicalTag?.getAttribute("href") || "");

        const ogTitleTag = safeDocument.querySelector('meta[property="og:title"]');
        const ogDescriptionTag = safeDocument.querySelector(
          'meta[property="og:description"]',
        );
        const ogImageTag = safeDocument.querySelector('meta[property="og:image"]');

        const h1Elements = Array.from(safeDocument.querySelectorAll("h1") || []);
        const h1Texts = h1Elements
          .map((node) => normalizeText(node?.textContent || ""))
          .filter((text) => text.length > 0);

        const imageElements = Array.from(safeDocument.querySelectorAll("img") || []);
        const imagesMissingAlt = imageElements.filter((img) => {
          const altValue = img?.getAttribute("alt");
          return normalizeText(altValue || "").length === 0;
        }).length;

        const linkElements = Array.from(safeDocument.querySelectorAll("a") || []);

        return {
          title: titleText || "Missing",
          metaDescription: metaDescriptionText || "Missing",
          h1: {
            count: h1Elements.length || 0,
            texts: h1Texts,
          },
          images: {
            total: imageElements.length || 0,
            missingAlt: imagesMissingAlt || 0,
          },
          links: {
            total: linkElements.length || 0,
          },
          canonical: canonicalText || "Missing",
          openGraph: {
            title: normalizeText(ogTitleTag?.getAttribute("content") || "") || "Missing",
            description:
              normalizeText(ogDescriptionTag?.getAttribute("content") || "") ||
              "Missing",
            image: normalizeText(ogImageTag?.getAttribute("content") || "") || "Missing",
          },
        };
      } catch (error) {
        void error;
        return {
          title: "Missing",
          metaDescription: "Missing",
          h1: { count: 0, texts: [] },
          images: { total: 0, missingAlt: 0 },
          links: { total: 0 },
          canonical: "Missing",
          openGraph: {
            title: "Missing",
            description: "Missing",
            image: "Missing",
          },
        };
      }
    });

    return {
      title: sanitizeText(seoData?.title),
      metaDescription: sanitizeText(seoData?.metaDescription),
      h1: {
        count: sanitizeCount(seoData?.h1?.count),
        texts: Array.isArray(seoData?.h1?.texts)
          ? seoData.h1.texts
              .map((item) => (typeof item === "string" ? item.trim() : ""))
              .filter((item) => item.length > 0)
          : [],
      },
      images: {
        total: sanitizeCount(seoData?.images?.total),
        missingAlt: sanitizeCount(seoData?.images?.missingAlt),
      },
      links: {
        total: sanitizeCount(seoData?.links?.total),
      },
      canonical: sanitizeText(seoData?.canonical),
      openGraph: {
        title: sanitizeText(seoData?.openGraph?.title),
        description: sanitizeText(seoData?.openGraph?.description),
        image: sanitizeText(seoData?.openGraph?.image),
      },
    };
  } catch (error) {
    void error;
    return getSeoFallback();
  }
}
