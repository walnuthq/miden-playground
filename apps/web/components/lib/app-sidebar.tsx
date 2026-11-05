import { useMiden } from "@miden-sdk/react";
import type { Sidebar } from "@workspace/ui/components/sidebar";
import { type ComponentProps, useEffect } from "react";
import { AppSidebarView } from "@/components/lib/app-sidebar-view";
import ProjectSwitcher from "@/components/lib/project-switcher";
import useAccounts from "@/hooks/use-accounts";
import useNetwork from "@/hooks/use-network";
import useTutorials from "@/hooks/use-tutorials";

// The app's sidebar: `AppSidebarView` (SDK-free, the app shell's too) with
// the project switcher's menu.
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
