import type { ComponentType } from "react";
import { createBrowserRouter, redirect } from "react-router";
import AppShell from "@/components/lib/app-shell";
import NotFound from "@/components/lib/not-found";

// Splits each page into its own chunk, as Next did per route.
const page = (load: () => Promise<{ default: ComponentType }>) => async () => ({
  Component: (await load()).default,
});

const router = createBrowserRouter([
  {
    // Lazy, like the layout and the pages: the root layout's providers pull
    // in the SDK, whose eager entry awaits the WASM. Until that module loads,
    // the router renders the fallback alone, inside the router context: the
    // app shell, from the SDK-free graph the entry imports (main.tsx). The
    // three lazy modules load in parallel from the start.
    lazy: page(() => import("@/components/lib/root-layout")),
    HydrateFallback: AppShell,
    children: [
      {
        lazy: page(() => import("@/components/lib/sidebar-layout")),
        children: [
          { index: true, lazy: page(() => import("@/pages/home")) },
          { path: "accounts", lazy: page(() => import("@/pages/accounts")) },
          {
            path: "accounts/:identifier",
            lazy: page(() => import("@/pages/account")),
          },
          // The Components pages are gone: an account component is a
          // script (spec/remove-components.md). Old links land on Scripts.
          { path: "components", loader: () => redirect("/scripts") },
          { path: "components/:id", loader: () => redirect("/scripts") },
          { path: "notes", lazy: page(() => import("@/pages/notes")) },
          { path: "notes/:id", lazy: page(() => import("@/pages/note")) },
          { path: "scripts", lazy: page(() => import("@/pages/scripts")) },
          { path: "scripts/:id", lazy: page(() => import("@/pages/script")) },
          // A project link: its description is in the fragment
          // (lib/utils/project-link.ts).
          { path: "open", lazy: page(() => import("@/pages/open")) },
          {
            path: "transactions",
            lazy: page(() => import("@/pages/transactions")),
          },
          {
            path: "transactions/:id",
            lazy: page(() => import("@/pages/transaction")),
          },
          { path: "*", Component: NotFound },
        ],
      },
    ],
  },
]);

export default router;
