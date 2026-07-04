import { Link, useLocation } from "react-router";
import { Home, LayoutDashboard, FileText, Activity, Link2, Repeat, AlertOctagon, Gauge, Shield, Cpu, Images, BarChart2, Share2, PieChart, LogOut } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { useReport } from "../context/ReportContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import GoogleSignInButton from "./GoogleSignInButton.jsx";

function initials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return parts.length === 1 ? parts[0].slice(0, 2).toUpperCase() : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Section grouping mirrors the reference's nav (Audit Overview / Crawl
// Analysis / Content & SEO / Visualizations) — see docs/ROADMAP.md.
const NAV_SECTIONS = [
  {
    label: "Audit Overview",
    items: [
      { path: "/home", label: "Home", icon: Home },
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
  {
    label: "Content & SEO",
    items: [
      { path: "/content-insights", label: "Content Insights", icon: BarChart2 },
      { path: "/techstack", label: "Tech Detection", icon: Cpu },
    ],
  },
  {
    label: "Visualizations",
    items: [
      { path: "/charts", label: "Crawl Analytics", icon: PieChart },
      { path: "/network", label: "Internal Linking", icon: Share2 },
      { path: "/gallery", label: "Gallery", icon: Images },
    ],
  },
];

export function Sidebar() {
  const location = useLocation();
  const { data } = useReport();
  const { user, signOut } = useAuth();
  const issueCount = data?.data?.categories?.reduce((n, c) => n + (c.issues?.length || 0), 0) ?? 0;
  const securityCount = data?.data?.securityFindings?.length ?? 0;

  return (
    <aside className="flex w-60 flex-col border-r border-border bg-background">
      <div className="flex h-16 items-center border-b border-border px-6">
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
                        : "text-muted-foreground hover:bg-card hover:text-foreground"
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

      <div className="border-t border-border p-4">
        {user ? (
          <div className="flex items-center gap-3 rounded-lg p-2 hover:bg-card">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.picture} alt={user.name} />
              <AvatarFallback className="bg-[#6366F1] text-white text-sm">
                {initials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 overflow-hidden">
              <div className="truncate text-sm text-foreground">{user.name}</div>
              <div className="truncate text-xs text-muted-foreground">{user.email}</div>
            </div>
            <button
              type="button"
              onClick={signOut}
              title="Sign out"
              className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-background hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 p-2">
            <p className="text-xs text-muted-foreground">Sign in to personalize your profile</p>
            <GoogleSignInButton />
          </div>
        )}
      </div>
    </aside>
  );
}
export default Sidebar;
