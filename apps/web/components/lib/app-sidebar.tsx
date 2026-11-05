import { useMiden } from "@miden-sdk/react";
import { Separator } from "@workspace/ui/components/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  useSidebar,
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
import { type ComponentProps, type ReactNode, useEffect } from "react";
import { useLocation } from "react-router";
import useGlobalContext from "@/components/global-context/hook";
import Footer from "@/components/lib/footer";
import NavMain from "@/components/lib/nav-main";
import ProjectSwitcher from "@/components/lib/project-switcher";
import useAccounts from "@/hooks/use-accounts";
import useNetwork from "@/hooks/use-network";
import useTutorials from "@/hooks/use-tutorials";
import { defaultComponentIds } from "@/lib/types/default-components";
import { defaultScriptIds } from "@/lib/types/default-scripts";
import { formatId } from "@/lib/utils";

// The sidebar's links, with the latest accounts, transactions, notes, scripts
// and components of the project. From the app state alone, not the Miden
// client, so the app shell shows them too.
const useSidebarItems = () => {
  const { accounts, transactions, inputNotes, scripts, components } =
    useGlobalContext();
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
  return { items, editorItems };
};

// The sidebar, with `header` on top (the project switcher). Free of the Miden
// client's hooks: the app shell (shown while the client initializes) renders
// it too.
export const AppSidebarView = ({
  header,
  ...props
}: ComponentProps<typeof Sidebar> & { header: ReactNode }) => {
  const { items, editorItems } = useSidebarItems();
  // On mobile the sidebar is a sheet over the page: close it once a link (or
  // the project switcher) navigates, or it hides the page it just opened.
  // `key` changes on every navigation, a link to the current path included.
  const { key: locationKey } = useLocation();
  const { setOpenMobile } = useSidebar();
  // biome-ignore lint/correctness/useExhaustiveDependencies: runs on navigation.
  useEffect(() => {
    setOpenMobile(false);
  }, [locationKey, setOpenMobile]);
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>{header}</SidebarHeader>
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

const AppSidebar = (props: ComponentProps<typeof Sidebar>) => {
  const { networkId } = useNetwork();
  const { client } = useMiden();
  const { isTutorial } = useTutorials();
  const { needsConnectedWalletImport, importConnectedWallet } = useAccounts();
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
  return <AppSidebarView header={<ProjectSwitcher />} {...props} />;
};

export default AppSidebar;
