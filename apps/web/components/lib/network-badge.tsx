import { useSyncState } from "@miden-sdk/react";
import { useEffect } from "react";
import { useInterval } from "usehooks-ts";
import useGlobalContext from "@/components/global-context/hook";
import { NetworkBadgeView } from "@/components/lib/network-badge-view";
import useAppState from "@/hooks/use-app-state";
import useDocumentVisible from "@/hooks/use-document-visible";
import useExamples from "@/hooks/use-examples";
import useNetwork from "@/hooks/use-network";
import { workspaceLeft } from "@/lib/utils/workspace-guard";

let callingPopState = false;
// The workspace run whose example account is being deployed. A switch doesn't
// wait for it: nothing can cancel a deploy, it can take minutes, and it can't
// write to the next workspace anyway (see GlobalContextProvider).
let deployingWorkspaceRun: number | null = null;

// The live network badge: `NetworkBadgeView` (SDK-free, the app shell's too)
// with the client's sync state, and the app's own sync loop.
const NetworkBadge = () => {
  const { syncHeight, isSyncing } = useSyncState();
  const { networkId } = useNetwork();
  const {
    accounts,
    syncingState,
    submittingTransaction,
    nextState,
    workspaceRun,
  } = useGlobalContext();
  const switching = nextState !== null;
  const { syncState, popState } = useAppState();
  const { exampleId, loadExample } = useExamples();
  const exampleAccount = accounts.find(({ components }) =>
    components.includes(exampleId),
  );
  // Not while the tab is hidden: it would keep querying the node and the note
  // transport for nobody. It ticks again within 2.5 s of the tab showing.
  const visible = useDocumentVisible();
  const useIntervalTriggered =
    networkId !== "mmck" &&
    visible &&
    !isSyncing &&
    !syncingState &&
    !submittingTransaction &&
    // The store is about to be replaced, and its accounts with it.
    !switching;
  useInterval(
    () => {
      // console.log("SYNCING...");
      syncState();
      // console.log("SYNCING DONE");
    },
    useIntervalTriggered ? 2500 : null,
  );
  useEffect(() => {
    const callPopState = async () => {
      callingPopState = true;
      try {
        // Every outcome of an import clears the state it was queued with, so
        // this doesn't run again for the same one.
        await popState();
      } catch (error) {
        console.error("ERROR: popState", error);
      } finally {
        callingPopState = false;
      }
    };
    if (!syncingState && !callingPopState) {
      callPopState();
    }
  }, [syncingState, popState]);
  useEffect(() => {
    const callLoadExample = async () => {
      deployingWorkspaceRun = workspaceRun;
      await loadExample(exampleId, () => workspaceLeft(workspaceRun));
      if (deployingWorkspaceRun === workspaceRun) {
        deployingWorkspaceRun = null;
      }
    };
    // Not while switching: `exampleId` is the workspace being left, and a
    // deploy started now would finish in the next one.
    if (
      exampleId &&
      !exampleAccount &&
      !switching &&
      deployingWorkspaceRun !== workspaceRun
    ) {
      callLoadExample();
    }
  }, [exampleId, exampleAccount, switching, workspaceRun, loadExample]);
  return (
    <NetworkBadgeView
      networkId={networkId}
      syncHeight={syncHeight}
      syncing={isSyncing}
    />
  );
};

export default NetworkBadge;
