import { useMiden } from "@miden-sdk/react";
import type { Sidebar } from "@workspace/ui/components/sidebar";
import { type ComponentProps, useEffect } from "react";
import { AppSidebarView } from "@/components/lib/app-sidebar-view";
import DeleteProjectAlertDialog from "@/components/lib/delete-project-alert-dialog";
import ProjectSwitcher from "@/components/lib/project-switcher";
import SaveProjectDialog from "@/components/lib/save-project-dialog";
import useAccounts from "@/hooks/use-accounts";
import useNetwork from "@/hooks/use-network";
import useTutorials from "@/hooks/use-tutorials";

// The app's sidebar: `AppSidebarView` (SDK-free, the app shell's too) with
// the project switcher's menu, and the dialogs its Projects submenu opens
// (outside the sidebar: on a phone it's a sheet, unmounted when closed).
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
  return (
    <>
      <AppSidebarView header={<ProjectSwitcher />} {...props} />
      <SaveProjectDialog />
      <DeleteProjectAlertDialog />
    </>
  );
};

export default AppSidebar;
