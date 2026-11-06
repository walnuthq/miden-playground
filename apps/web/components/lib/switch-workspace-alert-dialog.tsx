import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog";
import {
  answerWorkspaceSwitchWarning,
  useWorkspaceSwitchWarningOpen,
} from "@/lib/utils/workspace-guard";

// Warns before leaving a workspace while Bread Wallet funds one of its Mainnet
// accounts (see confirmWorkspaceSwitch). Rendered next to the sidebar: a switch
// can start from its menu or from a home page card.
const SwitchWorkspaceAlertDialog = () => {
  const open = useWorkspaceSwitchWarningOpen();
  return (
    <AlertDialog
      open={open}
      onOpenChange={(open) => !open && answerWorkspaceSwitchWarning(false)}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Bread Wallet is funding an account
          </AlertDialogTitle>
          <AlertDialogDescription>
            Leaving this workspace loses the new account, along with any USDCx
            Bread Wallet sends it, and that can't be recovered. If Bread Wallet
            is still asking you to approve the funding, reject it there.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Stay here</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={() => answerWorkspaceSwitchWarning(true)}
          >
            Leave anyway
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default SwitchWorkspaceAlertDialog;
