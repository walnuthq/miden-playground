import { useEffect } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import useGlobalContext from "@/components/global-context/hook";
import useAccounts from "@/hooks/use-accounts";
import useAppState from "@/hooks/use-app-state";
import useNetwork from "@/hooks/use-network";
import { trackEvent } from "@/lib/analytics";
import type { AnalyticsOutcome } from "@/lib/analytics-events";
import { forkScripts } from "@/lib/api";
import type { ProjectLink, ProjectLinkAccount } from "@/lib/utils/project-link";
import { compiledPackageToScript } from "@/lib/utils/script";
import {
  confirmWorkspaceSwitch,
  workspaceLeft,
} from "@/lib/utils/workspace-guard";

// A failed import's toast stays, as it's the way to try again, until the
// workspace it belongs to is left.
export const PROJECT_LINK_IMPORT_FAILED_TOAST = "project-link-import-failed";

// Opens a project link (spec/project-links.md) as launching an example does
// (hooks/use-examples.ts): the reader's own copies of its scripts, in a new
// sandbox on its network. Its accounts are imported by address once the
// client is ready there (NetworkBadge, `projectLinkAccounts`).
const useProjectLink = () => {
  const navigate = useNavigate();
  const { switchNetwork } = useNetwork();
  const { leaveTutorial, pushState, freshSandboxState } = useAppState();
  const openProjectLink = async (
    link: ProjectLink,
  ): Promise<{ error?: string; cancelled?: boolean }> => {
    if (!(await confirmWorkspaceSwitch())) {
      return { cancelled: true };
    }
    const track = (outcome: AnalyticsOutcome) =>
      trackEvent("open_project_link", {
        network_id: link.networkId,
        script_count: link.scriptIds.length,
        account_count: link.accounts.length,
        outcome,
      });
    const { scripts, error } = await forkScripts(link.scriptIds).catch(
      (error: unknown) => ({
        scripts: undefined,
        error: error instanceof Error ? error.message : String(error),
      }),
    );
    if (!scripts) {
      track("failed");
      return { error: error ?? "The scripts couldn't be copied." };
    }
    const tutorialProgress = await leaveTutorial();
    switchNetwork(link.networkId);
    // Not a new sandbox's starter scripts (Mainnet's counter): the link has
    // its own.
    const state = freshSandboxState(link.networkId, {
      starter: {
        scripts: scripts.map((compiledScript) =>
          compiledPackageToScript(compiledScript),
        ),
      },
      tutorialProgress,
    });
    pushState({ ...state, projectLinkAccounts: link.accounts });
    navigate("/accounts");
    toast.info(`${link.title || "Project"} opened.`, {
      description:
        link.accounts.length > 0
          ? "The scripts are your own copies. Its accounts will show up here in a moment."
          : "The scripts are your own copies.",
    });
    track("ok");
    return {};
  };
  return { openProjectLink };
};

// The workspace run whose link accounts are being imported, or failed to be:
// a failed import isn't tried again until the user asks (its toast's Retry),
// or the page is reloaded (they stay in `projectLinkAccounts`).
let importingWorkspaceRun: number | null = null;

// Imports an opened link's accounts by address, once its workspace is the
// current one (NetworkBadge renders under the client gate: the client is
// ready). Its scripts are in the state by then, so each account lists the
// copies whose procedures its code holds as its components. Public state only:
// nothing is signed or sent.
export const useImportProjectLinkAccounts = () => {
  const { projectLinkAccounts, nextState, workspaceRun, dispatch } =
    useGlobalContext();
  const { importAccountByAddress } = useAccounts();
  const switching = nextState !== null;
  useEffect(() => {
    const importAccounts = async (accounts: ProjectLinkAccount[]) => {
      importingWorkspaceRun = workspaceRun;
      const abandoned = () => workspaceLeft(workspaceRun);
      const failed: { account: ProjectLinkAccount; error: unknown }[] = [];
      for (const account of accounts) {
        try {
          await importAccountByAddress(account);
          dispatch({
            type: "PROJECT_LINK_ACCOUNT_IMPORTED",
            payload: { address: account.address },
          });
        } catch (error) {
          failed.push({ account, error });
        }
        if (abandoned()) {
          return;
        }
      }
      const [first] = failed;
      if (!first) {
        return;
      }
      console.error("ERROR: importProjectLinkAccounts", failed);
      toast.error(
        failed.length === 1
          ? `${first.account.name} couldn't be imported.`
          : `${failed.length} accounts couldn't be imported.`,
        {
          description:
            "It may not be on chain any more (a network reset), or the node didn't answer.",
          id: PROJECT_LINK_IMPORT_FAILED_TOAST,
          duration: Number.POSITIVE_INFINITY,
          closeButton: true,
          action: {
            label: "Retry",
            onClick: () => {
              if (!abandoned()) {
                importAccounts(failed.map(({ account }) => account));
              }
            },
          },
        },
      );
    };
    if (
      projectLinkAccounts.length > 0 &&
      !switching &&
      importingWorkspaceRun !== workspaceRun
    ) {
      importAccounts(projectLinkAccounts);
    }
  }, [
    projectLinkAccounts,
    switching,
    workspaceRun,
    importAccountByAddress,
    dispatch,
  ]);
  // `workspaceRun` is what this runs on: its cleanup leaves the workspace.
  useEffect(
    () => () => {
      toast.dismiss(PROJECT_LINK_IMPORT_FAILED_TOAST);
    },
    [workspaceRun],
  );
};

export default useProjectLink;
