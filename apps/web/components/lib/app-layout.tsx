import {
  SidebarInset,
  SidebarProvider,
} from "@workspace/ui/components/sidebar";
import type { ReactNode } from "react";

// The sidebar and the page next to it, for the app (SidebarLayout) and its
// shell (AppShell, shown before the SDK loads and while the Miden client
// initializes). In its own module so the shell's graph stays SDK-free.
export const AppLayout = ({
  sidebar,
  children,
}: {
  sidebar: ReactNode;
  children: ReactNode;
}) => (
  <SidebarProvider>
    {sidebar}
    {/* min-w-0: a flex item, it would otherwise grow to its widest content
        (an editor Monaco has laid out in pixels) instead of the window. */}
    <SidebarInset className="min-w-0">{children}</SidebarInset>
  </SidebarProvider>
);
