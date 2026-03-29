import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { ScanProvider } from "./context/ScanContext.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ScanProvider>
      <App />
    </ScanProvider>
  </StrictMode>,
);
