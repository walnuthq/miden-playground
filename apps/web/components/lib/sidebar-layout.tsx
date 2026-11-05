import {
  SidebarInset,
  SidebarProvider,
} from "@workspace/ui/components/sidebar";
import type { ReactNode } from "react";
import { Outlet } from "react-router";
import AppSidebar from "@/components/lib/app-sidebar";
import Header from "@/components/lib/header";
import TutorialLayout from "@/components/tutorials/tutorial-layout";

// The sidebar and the page next to it, for the app and its shell (shown while
// the Miden client initializes).
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

const SidebarLayout = () => (
  <AppLayout sidebar={<AppSidebar />}>
    <TutorialLayout>
      <Header />
      <Outlet />
    </TutorialLayout>
  </AppLayout>
);

export default SidebarLayout;
