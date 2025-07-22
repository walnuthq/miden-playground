import { type ReactNode } from "react";
import {
  SidebarProvider,
  SidebarInset,
} from "@workspace/ui/components/sidebar";
import AppSidebar from "@/components/lib/app-sidebar";
import Header from "@/components/lib/header";

const SidebarLayout = ({ children }: { children: ReactNode }) => (
  <SidebarProvider>
    <AppSidebar />
    <SidebarInset>
      <Header />
      {children}
    </SidebarInset>
  </SidebarProvider>
);

export default SidebarLayout;
