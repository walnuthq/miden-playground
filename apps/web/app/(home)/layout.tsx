"use client";
import {
  SidebarInset,
  SidebarProvider,
} from "@workspace/ui/components/sidebar";
import type { ReactNode } from "react";
import AppSidebar from "@/components/lib/app-sidebar";
import Header from "@/components/lib/header";
import TutorialLayout from "@/components/tutorials/tutorial-layout";

const SidebarLayout = ({ children }: { children: ReactNode }) => (
  <SidebarProvider>
    <AppSidebar />
    <SidebarInset>
      <TutorialLayout>
        <Header />
        {children}
      </TutorialLayout>
    </SidebarInset>
  </SidebarProvider>
);

export default SidebarLayout;
