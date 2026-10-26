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
    <SidebarInset>
      <TutorialLayout>
        <Header />
        <Outlet />
      </TutorialLayout>
    </SidebarInset>
  </SidebarProvider>
);

export default SidebarLayout;
