import { useSyncState } from "@miden-sdk/react";
import { useEffect } from "react";
import { useInterval } from "usehooks-ts";
import useGlobalContext from "@/components/global-context/hook";
import { NetworkBadgeView } from "@/components/lib/network-badge-view";
import useAppState from "@/hooks/use-app-state";
import useDocumentVisible from "@/hooks/use-document-visible";
import useExamples from "@/hooks/use-examples";
import useNetwork from "@/hooks/use-network";

let callingPopState = false;
let callingLoadExample = false;

// The live network badge: `NetworkBadgeView` (SDK-free, the app shell's too)
// with the client's sync state, and the app's own sync loop.
const NetworkBadge = () => {
  const { syncHeight, isSyncing } = useSyncState();
  const { networkId } = useNetwork();
  const { accounts, syncingState, submittingTransaction } = useGlobalContext();
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
    !submittingTransaction;
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
      await popState();
      callingPopState = false;
    };
    if (!syncingState && !callingPopState) {
      callPopState();
    }
  }, [syncingState, popState]);
  useEffect(() => {
    const callLoadExample = async () => {
      callingLoadExample = true;
      await loadExample(exampleId);
      callingLoadExample = false;
    };
    if (exampleId && !exampleAccount && !callingLoadExample) {
      callLoadExample();
    }
  }, [exampleId, exampleAccount, loadExample]);
  return (
    <NetworkBadgeView
      networkId={networkId}
      syncHeight={syncHeight}
      syncing={isSyncing}
    />
  );
};

export default NetworkBadge;
