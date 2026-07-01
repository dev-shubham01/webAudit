import { CheckCircle2, Image as ImageIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { cardShell, sectionDescClass, sectionTitleClass } from "./dashboard.utils";

const formatImageSize = (size, sizeKB) => {
  const bytes = Number(size);
  if (Number.isFinite(bytes) && bytes > 0) {
    if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }
    return `${(bytes / 1024).toFixed(2)} KB`;
  }

  const kb = Number(sizeKB);
  if (Number.isFinite(kb) && kb > 0) {
    return kb >= 1024 ? `${(kb / 1024).toFixed(2)} MB` : `${kb.toFixed(2)} KB`;
  }

  return "Unknown";
};

export default function ImageOptimizationSection({ totalImages, largeImages }) {
  const safeLargeImages = Array.isArray(largeImages) ? largeImages : [];
  const largeImagesCount = safeLargeImages.length;

  return (
    <Card className={cardShell}>
      <CardHeader className="border-b border-[#334155] pb-4">
        <CardTitle className={`flex items-center gap-2 ${sectionTitleClass}`}>
          <ImageIcon className="h-5 w-5 shrink-0 text-[#6366F1]" />
          Image Optimization
        </CardTitle>
        <p className={sectionDescClass}>Image payload checks from current page assets</p>
      </CardHeader>
      <CardContent className="space-y-5 pt-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-[#334155] bg-[#0F172A]/60 px-4 py-4">
            <p className="text-xs uppercase tracking-wide text-[#94A3B8]">Total Images</p>
            <p className="mt-2 text-3xl font-bold tabular-nums text-[#E2E8F0]">{totalImages}</p>
          </div>
          <div
            className={`rounded-xl border px-4 py-4 ${
              largeImagesCount > 0
                ? "border-[#EAB308]/40 bg-[#EAB308]/10"
                : "border-[#334155] bg-[#0F172A]/60"
            }`}
          >
            <p className="text-xs uppercase tracking-wide text-[#94A3B8]">Large Images</p>
            <p
              className={`mt-2 text-3xl font-bold tabular-nums ${
                largeImagesCount > 0 ? "text-[#FDE047]" : "text-[#E2E8F0]"
              }`}
            >
              {largeImagesCount}
            </p>
          </div>
        </div>

        {largeImagesCount > 0 ? (
          <div className="rounded-xl border border-[#EAB308]/40 bg-[#78350F]/20 p-4">
            <p className="mb-3 text-sm font-semibold text-[#FDE047]">Large image list</p>
            <ul className="space-y-2">
              {safeLargeImages.map((item, index) => {
                const imageUrl =
                  typeof item?.url === "string" && item.url.trim() ? item.url : "Unknown URL";
                const imageSize = formatImageSize(item?.size, item?.sizeKB);
                return (
                  <li
                    key={`${imageUrl}-${index}`}
                    className="rounded-lg border border-[#EAB308]/30 bg-[#0F172A]/70 px-3 py-2 text-sm text-[#F8FAFC]"
                  >
                    <span className="font-medium text-[#FDE047]">{imageSize}</span>
                    <span className="mx-2 text-[#A16207]">-</span>
                    <span className="break-all">{imageUrl}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-xl border border-[#22C55E]/30 bg-[#22C55E]/5 px-4 py-4 text-[#86EFAC]">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-[#22C55E]" aria-hidden />
            <p className="font-medium">✅ Images are optimized</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
