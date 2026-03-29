import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { cardShell, sectionTitleClass } from "./dashboard.utils";

export default function WebsitePreviewSection({ screenshot }) {
  return (
    <Card className={cardShell}>
      <CardHeader className="border-b border-[#334155] pb-4">
        <CardTitle className={sectionTitleClass}>Website Preview</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        {screenshot ? (
          <div className="max-h-[min(70vh,720px)] w-full scroll-smooth overflow-auto rounded-lg border border-[#334155] bg-[#0F172A] p-2">
            <img
              src={`data:image/png;base64,${screenshot}`}
              alt="Website Preview"
              className="w-full rounded-xl"
            />
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-[#334155] bg-[#0F172A]/60 px-4 py-6 text-center">
            <p className="text-sm text-[#94A3B8]">Preview not available</p>
            <p className="mt-1 text-xs text-[#64748B]">
              (Some websites block automated rendering)
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
