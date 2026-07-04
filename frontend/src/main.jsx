import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { ReportProvider } from "./context/ReportContext.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <ReportProvider>
        <App />
      </ReportProvider>
    </AuthProvider>
  </StrictMode>,
);
