import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router/dom";
// Para's stylesheet ships its own Tailwind preflight, so it must come before
// index.css (globals.css) for the app's base rules (e.g. border colors) to win.
import "@getpara/react-sdk-lite/styles.css";
import "@miden-sdk/miden-wallet-adapter/styles.css";
import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import "./index.css";
import router from "@/routes";

// A tab opened before a deploy requests page chunks that no longer exist:
// reload to get the new ones.
window.addEventListener("vite:preloadError", () => window.location.reload());

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element #root not found");
}

createRoot(rootElement).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
