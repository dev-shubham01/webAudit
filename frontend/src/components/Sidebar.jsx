import { Link, useLocation } from "react-router";
import {
  LayoutDashboard,
  FileText,
  Activity,
  GitCompare,
  Shield,
  Settings,
  User,
} from "lucide-react";
import { Avatar, AvatarFallback } from "./ui/avatar";

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/reports/1", label: "Reports", icon: FileText },
  { path: "/monitoring", label: "Monitoring", icon: Activity },
  { path: "/compare", label: "Compare", icon: GitCompare },
  { path: "/security", label: "Security", icon: Shield },
  { path: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const location = useLocation();

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

      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname.startsWith(item.path);

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
                isActive
                  ? "bg-[#6366F1] text-white"
                  : "text-[#94A3B8] hover:bg-[#1E293B] hover:text-[#E2E8F0]"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
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