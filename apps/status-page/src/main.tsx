import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "next-themes";

import "./index.css";
import App from "@/App.tsx";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element #root not found");
}

// Unlike apps/web, which pins itself to light with `forcedTheme`, the status
// page follows the system preference and lets the reader override it. The
// inline script in index.html applies the same choice before first paint.
createRoot(rootElement).render(
  <StrictMode>
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      enableColorScheme
      disableTransitionOnChange
    >
      <App />
    </ThemeProvider>
  </StrictMode>,
);
