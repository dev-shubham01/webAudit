import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Bell } from "lucide-react";
import Input from "./ui/input";
import Button from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { useScan } from "../context/ScanContext.jsx";

export function Navbar() {
  const [url, setUrl] = useState("");
  const { executeScan, loading } = useScan();
  const navigate = useNavigate();

  const handleAnalyze = async () => {
    try {
      await executeScan(url);
      navigate("/dashboard");
    } catch {
      /* error shown in ScanProvider banner */
    }
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-[#334155] bg-[#0F172A] px-8">
      <div className="flex flex-1 items-center gap-4 max-w-2xl">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
          <Input
            type="text"
            placeholder="Enter website URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleAnalyze();
            }}
            className="h-10 w-full rounded-lg border border-[#334155] bg-[#1E293B] pl-10 text-[#E2E8F0] placeholder:text-[#94A3B8] focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1]"
          />
        </div>
        <Button
          type="button"
          disabled={loading}
          onClick={() => void handleAnalyze()}
          className="h-10 rounded-lg bg-[#6366F1] px-6 text-white hover:bg-[#5558E3] disabled:cursor-not-allowed disabled:opacity-60"
        >
          Analyze
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 text-[#94A3B8] hover:bg-[#1E293B] hover:text-[#E2E8F0]"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[#EF4444]" />
        </Button>
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-[#6366F1] text-white text-sm">
            JD
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
export default Navbar;
