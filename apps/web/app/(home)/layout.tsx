"use client";
import { type ReactNode } from "react";
import { useInterval } from "usehooks-ts";
import {
  SidebarProvider,
  SidebarInset,
} from "@workspace/ui/components/sidebar";
import AppSidebar from "@/components/lib/app-sidebar";
import Header from "@/components/lib/header";
import useAccounts from "@/hooks/use-accounts";
import useGlobalContext from "@/components/global-context/hook";

const SidebarLayout = ({ children }: { children: ReactNode }) => {
  const { updateConsumableNotes } = useAccounts();
  // useInterval(() => {
  //   updateConsumableNotes();
  // }, 1000);
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Header />
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
};

export default SidebarLayout;
