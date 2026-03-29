import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { cardShell, sectionDescClass, sectionTitleClass } from "./dashboard.utils";
import SeoRow from "./SeoRow";

export function SeoSnapshotSection({ data }) {
  const {
    hasRealTitle,
    hasRealMeta,
    h1OkSingle,
    h1Count,
    h1Present,
    totalImages,
    altOk,
    missingAlt,
    title,
    metaDescription,
    truncate,
  } = data;

  return (
    <Card className={cardShell}>
      <CardHeader className="border-b border-[#334155] pb-4">
        <CardTitle className={sectionTitleClass}>SEO snapshot</CardTitle>
        <p className={sectionDescClass}>Quick checks from the crawled page</p>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <SeoRow
            label="Title"
            ok={hasRealTitle}
            okText="Present"
            badText="Missing or empty"
            detail={hasRealTitle ? truncate(title, 48) : null}
          />
          <SeoRow
            label="Meta description"
            ok={hasRealMeta}
            okText="Present"
            badText="Missing"
            detail={hasRealMeta ? truncate(metaDescription, 48) : null}
          />
          <SeoRow
            label="H1 heading"
            ok={h1OkSingle}
            okText="Single H1 present"
            badText={h1Count === 0 ? "No H1 found" : `${h1Count} H1 headings`}
            detail={h1Present && h1Count > 1 ? "Use one primary H1 per page" : undefined}
          />
          <SeoRow
            label="Image alt text"
            ok={altOk}
            okText={totalImages === 0 ? "No images" : "All images have alt"}
            badText={`${missingAlt} missing`}
            detail={!altOk && totalImages > 0 ? `${missingAlt} of ${totalImages} images` : undefined}
          />
        </div>
      </CardContent>
    </Card>
  );
}

export function AdvancedSeoSection({ data }) {
  const {
    canonicalPresent,
    canonicalValue,
    ogTitlePresent,
    ogTitleValue,
    ogDescriptionPresent,
    ogDescriptionValue,
    ogImagePresent,
    ogImageValue,
    truncate,
  } = data;

  return (
    <Card className={cardShell}>
      <CardHeader className="border-b border-[#334155] pb-4">
        <CardTitle className={sectionTitleClass}>Advanced SEO</CardTitle>
        <p className={sectionDescClass}>Canonical and Open Graph metadata checks</p>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <SeoRow
            label="Canonical"
            ok={canonicalPresent}
            okText="Present"
            badText="Missing"
            detail={canonicalPresent ? canonicalValue : null}
          />
          <SeoRow
            label="Open Graph title"
            ok={ogTitlePresent}
            okText="Present"
            badText="Missing"
            detail={ogTitlePresent ? truncate(ogTitleValue, 56) : null}
          />
          <SeoRow
            label="Open Graph description"
            ok={ogDescriptionPresent}
            okText="Present"
            badText="Missing"
            detail={ogDescriptionPresent ? truncate(ogDescriptionValue, 72) : null}
          />
          <SeoRow
            label="Open Graph image"
            ok={ogImagePresent}
            okText="Present"
            badText="Missing"
            detail={ogImagePresent ? truncate(ogImageValue, 56) : null}
          />
        </div>
      </CardContent>
    </Card>
  );
}
