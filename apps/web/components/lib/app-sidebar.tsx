"use client";

import { type ComponentProps } from "react";
import {
  UserCircle,
  File,
  Route,
  HandCoins,
  Wallet,
  Home,
  FileCode,
} from "lucide-react";
import { useIsClient } from "usehooks-ts";
import NavMain from "@/components/lib/nav-main";
import { formatId } from "@/lib/utils";
import ProjectSwitcher from "@/components/lib/project-switcher";
import Footer from "@/components/lib/footer";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@workspace/ui/components/sidebar";
import { Separator } from "@workspace/ui/components/separator";
import useAccounts from "@/hooks/use-accounts";
import useTransactions from "@/hooks/use-transactions";
import useNotes from "@/hooks/use-notes";
import useScripts from "@/hooks/use-scripts";

const AppSidebar = ({ ...props }: ComponentProps<typeof Sidebar>) => {
  const isClient = useIsClient();
  const { accounts } = useAccounts();
  const { transactions } = useTransactions();
  const { inputNotes } = useNotes();
  const { scripts } = useScripts();
  const items = [
    {
      title: "Home",
      url: "/",
      icon: Home,
    },
    {
      title: "Accounts",
      url: "/accounts",
      icon: UserCircle,
      items: accounts
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, 5)
        .map(({ name, address, isFaucet }) => ({
          title: name,
          url: `/accounts/${address}`,
          icon: isFaucet ? HandCoins : Wallet,
        })),
    },
    {
      title: "Transactions",
      url: "/transactions",
      icon: Route,
      items: transactions
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, 5)
        .map(({ id }) => ({
          title: formatId(id),
          url: `/transactions/${id}`,
        })),
    },
    {
      title: "Notes",
      url: "/notes",
      icon: File,
      items: inputNotes
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, 5)
        .map(({ id }) => ({
          title: formatId(id),
          url: `/notes/${id}`,
        })),
    },
  ];
  const editorItems = [
    {
      title: "Scripts",
      url: "/scripts",
      icon: FileCode,
      items: scripts
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, 5)
        .map(({ id, name }) => ({
          title: name,
          url: `/scripts/${id}`,
        })),
    },
  ];
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <ProjectSwitcher />
      </SidebarHeader>
      <SidebarContent>
        {isClient && <NavMain items={items} />}
        <Separator />
        {isClient && <NavMain items={editorItems} />}
      </SidebarContent>
      <SidebarFooter>
        <Footer />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
};

export default AppSidebar;
