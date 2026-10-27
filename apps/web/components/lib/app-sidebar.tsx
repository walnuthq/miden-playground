import { useMiden } from "@miden-sdk/react/lazy";
import { Separator } from "@workspace/ui/components/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@workspace/ui/components/sidebar";
import {
  CircleCheckBig,
  CircleDashed,
  CircleX,
  File,
  FileCode,
  FileText,
  HandCoins,
  Home,
  Key,
  Puzzle,
  ReceiptText,
  Route,
  // Signature,
  ShieldUser,
  UserCircle,
  Wallet,
} from "lucide-react";
import { type ComponentProps, useEffect } from "react";
import Footer from "@/components/lib/footer";
import NavMain from "@/components/lib/nav-main";
import ProjectSwitcher from "@/components/lib/project-switcher";
import useAccounts from "@/hooks/use-accounts";
import useComponents from "@/hooks/use-components";
import useNetwork from "@/hooks/use-network";
import useNotes from "@/hooks/use-notes";
import useScripts from "@/hooks/use-scripts";
import useTransactions from "@/hooks/use-transactions";
import useTutorials from "@/hooks/use-tutorials";
import { defaultComponentIds } from "@/lib/types/default-components";
import { defaultScriptIds } from "@/lib/types/default-scripts";
import { formatId } from "@/lib/utils";

const AppSidebar = ({ ...props }: ComponentProps<typeof Sidebar>) => {
  const { networkId } = useNetwork();
  const { client } = useMiden();
  const { isTutorial } = useTutorials();
  const { accounts, needsConnectedWalletImport, importConnectedWallet } =
    useAccounts();
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
        .map(({ name, identifier, isFaucet, components, multisig }) => ({
          title: name,
          url: `/accounts/${identifier}`,
          icon: isFaucet ? (
            <HandCoins className="size-4" />
          ) : multisig ? (
            <ShieldUser className="size-4" />
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
        .filter(({ id }) => id !== "")
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
            type === "account-component" ? (
              <UserCircle className="size-4" />
            ) : type === "note" ? (
              <File className="size-4" />
            ) : type === "tx-script" ? (
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
    if (
      client &&
      !isTutorial &&
      networkId !== "mmck" &&
      needsConnectedWalletImport
    ) {
      importConnectedWallet();
    }
  }, [
    client,
    isTutorial,
    networkId,
    needsConnectedWalletImport,
    importConnectedWallet,
  ]);
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <ProjectSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={items} />
        <Separator />
        <NavMain items={editorItems} />
      </SidebarContent>
      <SidebarFooter>
        <Footer />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
};

export default AppSidebar;
