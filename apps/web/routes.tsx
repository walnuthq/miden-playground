import type { ComponentType } from "react";
import { createBrowserRouter } from "react-router";
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
          {
            path: "components",
            lazy: page(() => import("@/pages/components")),
          },
          {
            path: "components/:id",
            lazy: page(() => import("@/pages/component")),
          },
          { path: "notes", lazy: page(() => import("@/pages/notes")) },
          { path: "notes/:id", lazy: page(() => import("@/pages/note")) },
          { path: "scripts", lazy: page(() => import("@/pages/scripts")) },
          { path: "scripts/:id", lazy: page(() => import("@/pages/script")) },
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
