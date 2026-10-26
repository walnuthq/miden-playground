import type { ComponentType } from "react";
import { createBrowserRouter } from "react-router";
import NotFound from "@/components/lib/not-found";
import RootLayout from "@/components/lib/root-layout";
import SidebarLayout from "@/components/lib/sidebar-layout";

// Splits each page into its own chunk, as Next did per route.
const page = (load: () => Promise<{ default: ComponentType }>) => async () => ({
  Component: (await load()).default,
});

const router = createBrowserRouter([
  {
    Component: RootLayout,
    // Rendered while the first page's chunk loads.
    HydrateFallback: () => null,
    children: [
      {
        Component: SidebarLayout,
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
