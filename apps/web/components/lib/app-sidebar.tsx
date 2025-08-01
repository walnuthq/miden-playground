"use client";

import { type ComponentProps } from "react";
import { UserCircle, File, Route, HandCoins, Wallet, Home } from "lucide-react";
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
import { useIsClient } from "usehooks-ts";
import useAccounts from "@/hooks/use-accounts";
import useTransactions from "@/hooks/use-transactions";
import useNotes from "@/hooks/use-notes";

const AppSidebar = ({ ...props }: ComponentProps<typeof Sidebar>) => {
  const isClient = useIsClient();
  const { accounts } = useAccounts();
  const { transactions } = useTransactions();
  const { inputNotes } = useNotes();
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
        .map(({ account, name, address }) => ({
          title: name,
          url: `/accounts/${address}`,
          icon: account.isFaucet() ? HandCoins : Wallet,
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
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <ProjectSwitcher />
      </SidebarHeader>
      <SidebarContent>
        {isClient && <NavMain items={items} />}
        {/*<NavProjects projects={data.projects} />*/}
      </SidebarContent>
      <SidebarFooter>
        <Footer />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
};

export default AppSidebar;
