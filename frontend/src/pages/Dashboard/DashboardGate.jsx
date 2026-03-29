import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useScan } from "../../context/ScanContext.jsx";
import Dashboard from "./Dashboard.jsx";

export default function DashboardGate() {
  const { scanResult } = useScan();
  const navigate = useNavigate();

  useEffect(() => {
    if (!scanResult) {
      navigate("/", { replace: true });
    }
  }, [scanResult, navigate]);

  if (!scanResult) {
    return null;
  }

  return <Dashboard />;
}
