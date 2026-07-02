import { Link, useLocation } from "react-router";
import { LayoutDashboard, FileText, Activity, Link2, Repeat, AlertOctagon, Gauge, Shield } from "lucide-react";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { useReport } from "../context/ReportContext.jsx";

// Section grouping mirrors the reference's nav (Audit Overview / Crawl
// Analysis / Content & SEO / Visualizations). Only sections with at least
// one built page are shown; more items join as later phases ship
// (Content Insights, Tech Detection, Crawl Analytics, etc.) — see docs/ROADMAP.md.
const NAV_SECTIONS = [
  {
    label: "Audit Overview",
    items: [
      { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { path: "/issues", label: "Site Audit", icon: AlertOctagon, badge: "issues" },
    ],
  },
  {
    label: "Crawl Analysis",
    items: [
      { path: "/links", label: "Link Explorer", icon: Link2 },
      { path: "/redirects", label: "Redirects", icon: Repeat },
      { path: "/content", label: "On-Page SEO", icon: FileText },
      { path: "/lighthouse", label: "Page Speed", icon: Gauge },
      { path: "/security", label: "Security & Headers", icon: Shield, badge: "security" },
    ],
  },
];

export function Sidebar() {
  const location = useLocation();
  const { data } = useReport();
  const issueCount = data?.data?.categories?.reduce((n, c) => n + (c.issues?.length || 0), 0) ?? 0;
  const securityCount = data?.data?.securityFindings?.length ?? 0;

  return (
    <aside className="flex w-60 flex-col border-r border-[#334155] bg-[#0F172A]">
      <div className="flex h-16 items-center border-b border-[#334155] px-6">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#6366F1]">
            <Activity className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-semibold text-white">WebHealth</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto p-4">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wide text-[#64748B]">
              {section.label}
            </p>
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname.startsWith(item.path);
                const badgeCount = item.badge === "issues" ? issueCount : item.badge === "security" ? securityCount : 0;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2 transition-colors ${
                      isActive
                        ? "bg-[#6366F1] text-white"
                        : "text-[#94A3B8] hover:bg-[#1E293B] hover:text-[#E2E8F0]"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </span>
                    {badgeCount > 0 && (
                      <Badge variant={item.badge === "security" ? "secondary" : "destructive"}>{badgeCount}</Badge>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-[#334155] p-4">
        <div className="flex items-center gap-3 rounded-lg p-2 hover:bg-[#1E293B]">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-[#6366F1] text-white text-sm">
              JD
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden">
            <div className="truncate text-sm text-[#E2E8F0]">John Doe</div>
            <div className="truncate text-xs text-[#94A3B8]">
              john@example.com
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
export default Sidebar;
