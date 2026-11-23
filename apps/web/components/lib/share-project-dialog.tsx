import { Button } from "@workspace/ui/components/button";
import { Checkbox } from "@workspace/ui/components/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { useState } from "react";
import { toast } from "sonner";
import { projectTitle } from "@/components/lib/project-switcher-view";
import useAccounts from "@/hooks/use-accounts";
import useExamples from "@/hooks/use-examples";
import useNetwork from "@/hooks/use-network";
import useSavedProjects from "@/hooks/use-saved-projects";
import useScripts from "@/hooks/use-scripts";
import { trackEvent } from "@/lib/analytics";
import { midenFaucetAccountId } from "@/lib/constants";
import { networks } from "@/lib/types/network";
import { isValidUUIDv4 } from "@/lib/utils";
import {
  isProjectLinkNetworkId,
  MAX_LINK_ACCOUNTS,
  MAX_LINK_SCRIPTS,
  MAX_LINK_TITLE_LENGTH,
  projectLinkUrl,
  shareableAccounts,
} from "@/lib/utils/project-link";

// The form, mounted each time the dialog opens: the ticks start from the
// workspace as it is then.
const ShareProjectForm = () => {
  const { networkId } = useNetwork();
  const { exampleId } = useExamples();
  const { projectName, closeShareProjectDialog } = useSavedProjects();
  const { accounts, isConnectedWallet } = useAccounts();
  const { scripts: workspaceScripts } = useScripts();
  // The menu offers Share only on these networks.
  const linkNetworkId = isProjectLinkNetworkId(networkId) ? networkId : "mtst";
  // The API's scripts (UUID ids): the built-ins are in every browser.
  const scripts = workspaceScripts.filter(({ id }) => isValidUUIDv4(id));
  const drafts = scripts.filter(({ status }) => status === "draft");
  const offered = shareableAccounts(accounts, {
    networkId: linkNetworkId,
    faucetId: midenFaucetAccountId(networkId),
    isConnectedWallet: (id) =>
      accounts.some(
        (account) => account.id === id && isConnectedWallet(account),
      ),
  });
  const [checked, setChecked] = useState(
    () => new Set(offered.filter(({ checked }) => checked).map(({ id }) => id)),
  );
  const [title, setTitle] = useState(() =>
    projectTitle({ projectName, tutorialId: "", exampleId, networkId }).slice(
      0,
      MAX_LINK_TITLE_LENGTH,
    ),
  );
  const selected = offered.filter(({ id }) => checked.has(id));
  const tooMany =
    scripts.length > MAX_LINK_SCRIPTS
      ? `This workspace has ${scripts.length} scripts: a link holds ${MAX_LINK_SCRIPTS} at most. Delete the ones the project doesn't need.`
      : selected.length > MAX_LINK_ACCOUNTS
        ? `A link holds ${MAX_LINK_ACCOUNTS} accounts at most.`
        : "";
  const copy = async () => {
    const link = projectLinkUrl(window.location.origin, {
      networkId: linkNetworkId,
      title,
      scriptIds: scripts.map(({ id }) => id),
      accounts: selected.map(({ name, address }) => ({ name, address })),
    });
    trackEvent("share_project", {
      network_id: linkNetworkId,
      script_count: scripts.length,
      account_count: selected.length,
    });
    try {
      await navigator.clipboard.writeText(link);
    } catch (error) {
      console.error("ERROR: shareProject", error);
      toast.error("The link couldn't be copied.", { description: link });
      return;
    }
    toast.success("Link copied.", {
      description: `Anyone with the link can open these scripts as their own copies, including your later changes, until you delete them, and import the accounts' public state.${drafts.length > 0 ? " It shows the last compiled version of each script: compile to share your latest changes." : ""}`,
    });
    closeShareProjectDialog();
  };
  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="grid gap-2">
          <Label htmlFor="share-project-title">Title</Label>
          <Input
            id="share-project-title"
            value={title}
            maxLength={MAX_LINK_TITLE_LENGTH}
            autoComplete="off"
            onChange={(event) => setTitle(event.target.value)}
          />
        </div>
        <section className="flex flex-col gap-2">
          <h3 className="font-medium text-sm">Scripts</h3>
          {scripts.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No script to share: create or import one first.
            </p>
          ) : (
            <ul className="flex flex-col gap-1 text-sm">
              {scripts.map(({ id, name, status }) => (
                <li key={id} className="flex min-w-0 items-center gap-2">
                  <span className="truncate font-mono">{name}</span>
                  {status === "draft" && (
                    <span className="shrink-0 text-muted-foreground text-xs">
                      Draft: its last compiled version is shared
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
        {offered.length > 0 && (
          <section className="flex flex-col gap-2">
            <h3 className="font-medium text-sm">Accounts</h3>
            <ul className="flex flex-col gap-3 text-sm">
              {offered.map(({ id, name, address, disabledReason }) => (
                <li key={id} className="flex min-w-0 items-start gap-2">
                  <Checkbox
                    id={`share-account-${id}`}
                    className="mt-0.5"
                    checked={checked.has(id)}
                    disabled={disabledReason !== undefined}
                    onCheckedChange={(value) =>
                      setChecked((current) => {
                        const next = new Set(current);
                        if (value) {
                          next.add(id);
                        } else {
                          next.delete(id);
                        }
                        return next;
                      })
                    }
                  />
                  <Label
                    htmlFor={`share-account-${id}`}
                    className="flex min-w-0 flex-col items-start gap-0.5 font-normal"
                  >
                    <span className="break-words">{name}</span>
                    <span className="break-all font-mono text-muted-foreground text-xs">
                      {address}
                    </span>
                    {disabledReason && (
                      <span className="text-muted-foreground text-xs">
                        {disabledReason}
                      </span>
                    )}
                  </Label>
                </li>
              ))}
            </ul>
          </section>
        )}
        {tooMany && (
          <p role="alert" className="text-destructive text-sm">
            {tooMany}
          </p>
        )}
      </div>
      <DialogFooter>
        <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
        <Button
          disabled={scripts.length === 0 || tooMany !== ""}
          onClick={copy}
        >
          Copy link
        </Button>
      </DialogFooter>
    </>
  );
};

// "Share project" (spec/project-links.md): a link to the workspace's scripts
// and the accounts ticked here. Opened from the project switcher's menu and
// rendered outside it, as the Save dialog is (see State.saveProjectDialogOpen).
const ShareProjectDialog = () => {
  const { networkId } = useNetwork();
  const { shareProjectDialogOpen, closeShareProjectDialog } =
    useSavedProjects();
  return (
    <Dialog
      open={shareProjectDialogOpen}
      modal={false}
      disablePointerDismissal
      onOpenChange={(open) => !open && closeShareProjectDialog()}
    >
      <DialogContent
        data-modal="false"
        className="max-h-[calc(100dvh-2rem)] grid-cols-[minmax(0,1fr)] overflow-y-auto sm:max-w-140"
      >
        <DialogHeader>
          <DialogTitle>Share Project</DialogTitle>
          <DialogDescription>
            A link that opens this project's scripts, as the reader's own
            copies, in a new {networks[networkId]} sandbox, with the accounts
            you tick imported from the chain. No keys, notes or private state
            are shared.
          </DialogDescription>
        </DialogHeader>
        {shareProjectDialogOpen && <ShareProjectForm />}
      </DialogContent>
    </Dialog>
  );
};

export default ShareProjectDialog;
