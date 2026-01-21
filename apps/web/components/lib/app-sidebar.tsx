"use client";
import { type ComponentProps, useEffect } from "react";
import {
  UserCircle,
  File,
  Route,
  HandCoins,
  Wallet,
  Home,
  FileCode,
  Puzzle,
  CircleX,
  CircleDashed,
  CircleCheckBig,
  FileText,
  Key,
  ReceiptText,
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
import useComponents from "@/hooks/use-components";
import { defaultScriptIds } from "@/lib/types/default-scripts";
import { defaultComponentIds } from "@/lib/types/default-components";
import useTutorials from "@/hooks/use-tutorials";
import { MIDEN_FAUCET_ADDRESS } from "@/lib/constants";
import useGlobalContext from "@/components/global-context/hook";
import { getAddressPart } from "@/lib/utils";

const AppSidebar = ({ ...props }: ComponentProps<typeof Sidebar>) => {
  const isClient = useIsClient();
  const { networkId } = useGlobalContext();
  const { tutorialId } = useTutorials();
  const {
    accounts,
    faucets,
    connectedWallet,
    importConnectedWallet,
    importAccountByAddress,
  } = useAccounts();
  const { transactions } = useTransactions();
  const { inputNotes } = useNotes();
  const { scripts } = useScripts();
  const { components } = useComponents();
  const items = [
    {
      title: "Home",
      url: "/",
      icon: <Home />,
    },
    {
      title: "Accounts",
      url: "/accounts",
      icon: <UserCircle />,
      items: accounts
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, 5)
        .map(({ name, address, isFaucet, components }) => ({
          title: name,
          url: `/accounts/${getAddressPart(address)}`,
          icon: isFaucet ? (
            <HandCoins className="size-4" />
          ) : components.includes("basic-wallet") ? (
            <Wallet className="size-4" />
          ) : (
            <FileText className="size-4" />
          ),
        })),
    },
    {
      title: "Transactions",
      url: "/transactions",
      icon: <Route />,
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
      icon: <ReceiptText />,
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
      icon: <FileCode />,
      items: scripts
        .filter(({ id }) => !defaultScriptIds.includes(id))
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, 5)
        .map(({ id, name, type, status }) => ({
          title: name,
          url: `/scripts/${id}`,
          icon:
            type === "account" ? (
              <UserCircle className="size-4" />
            ) : type === "note-script" ? (
              <File className="size-4" />
            ) : type === "transaction-script" ? (
              <Route className="size-4" />
            ) : (
              <Key className="size-4" />
            ),
          leftIcon:
            status === "draft" ? (
              <CircleDashed />
            ) : status === "compiled" ? (
              <CircleCheckBig className="text-green-500!" />
            ) : (
              <CircleX className="text-red-500!" />
            ),
        })),
    },
    {
      title: "Components",
      url: "/components",
      icon: <Puzzle />,
      items: components
        .filter(({ id }) => !defaultComponentIds.includes(id))
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, 5)
        .map(({ id, name }) => ({
          title: name,
          url: `/components/${id}`,
        })),
    },
  ];
  // TODO refactor using onConnect callback?
  useEffect(() => {
    if (networkId === "mtst" && !connectedWallet) {
      importConnectedWallet();
    }
  }, [networkId, connectedWallet, tutorialId, importConnectedWallet]);
  // automatically import Miden Faucet on testnet
  useEffect(() => {
    const midenFaucet = faucets.find(
      ({ address }) => address === MIDEN_FAUCET_ADDRESS
    );
    if (networkId === "mtst" && !midenFaucet) {
      importAccountByAddress({
        name: "Miden Faucet",
        address: MIDEN_FAUCET_ADDRESS,
      });
    }
  }, [networkId, faucets, tutorialId, importAccountByAddress]);
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
