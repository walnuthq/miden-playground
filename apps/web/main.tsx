import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router/dom";
// Para's stylesheet ships its own Tailwind preflight, so it must come before
// index.css (globals.css) for the app's base rules (e.g. border colors) to win.
// Both stylesheets stay here, in the entry, so that order holds: Para's code
// itself only comes with the lazy root layout.
import "@getpara/react-sdk-lite/styles.css";
import "@miden-sdk/miden-wallet-adapter/styles.css";
import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import "./index.css";
import OuterProviders from "@/components/providers/outer";
import router from "@/routes";

// This entry, routes.tsx and the app shell they render first import nothing
// from the SDK or Para: the SDK's eager entry awaits the WASM at module load,
// and a module graph that reached it would wait for it too. The shell paints
// from here while the root layout (where the SDK comes in) loads. The build
// checks it (`shellIsSdkFree` in vite.config.ts).

// A tab opened before a deploy requests page chunks that no longer exist:
// reload to get the new ones.
window.addEventListener("vite:preloadError", () => window.location.reload());

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element #root not found");
}

createRoot(rootElement).render(
  <StrictMode>
    <OuterProviders>
      <RouterProvider router={router} />
    </OuterProviders>
  </StrictMode>,
);
