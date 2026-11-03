import {
  SidebarInset,
  SidebarProvider,
} from "@workspace/ui/components/sidebar";
import { Outlet } from "react-router";
import AppSidebar from "@/components/lib/app-sidebar";
import Header from "@/components/lib/header";
import TutorialLayout from "@/components/tutorials/tutorial-layout";

const SidebarLayout = () => (
  <SidebarProvider>
    <AppSidebar />
    {/* min-w-0: a flex item, it would otherwise grow to its widest content
        (an editor Monaco has laid out in pixels) instead of the window. */}
    <SidebarInset className="min-w-0">
      <TutorialLayout>
        <Header />
        <Outlet />
      </TutorialLayout>
    </SidebarInset>
  </SidebarProvider>
);

export default SidebarLayout;
