import { useSyncState } from "@miden-sdk/react";
import { Badge } from "@workspace/ui/components/badge";
import { Spinner } from "@workspace/ui/components/spinner";
import { CircleDot } from "lucide-react";
import { useEffect } from "react";
import { useInterval } from "usehooks-ts";
import useGlobalContext from "@/components/global-context/hook";
import useAppState from "@/hooks/use-app-state";
import useExamples from "@/hooks/use-examples";
import useNetwork from "@/hooks/use-network";
import { type NetworkId, networks } from "@/lib/types/network";

let callingPopState = false;
let callingLoadExample = false;

const variants = {
  mm: "default",
  mtst: "outline",
  mdev: "secondary",
  mlcl: "destructive",
  mmck: "default",
} as const;

// The network and its sync height, with a spinner while syncing. The app shell
// shows it without a height while the Miden client initializes.
export const NetworkBadgeView = ({
  networkId,
  syncHeight,
  syncing,
}: {
  networkId: NetworkId;
  syncHeight?: number;
  syncing: boolean;
}) => (
  <Badge
    variant={variants[networkId]}
    className="h-8"
    title={
      syncHeight === undefined
        ? `Syncing ${networks[networkId]}`
        : `${networks[networkId]} | #${syncHeight}`
    }
  >
    {/* The block height doesn't fit a phone's header. */}
    <span>
      {networks[networkId]}
      {syncHeight !== undefined && <span className="hidden sm:inline"> |</span>}
    </span>
    {syncHeight !== undefined && (
      <pre className="hidden sm:block">#{syncHeight}</pre>
    )}
    {syncing ? <Spinner /> : <CircleDot />}
  </Badge>
);

const NetworkBadge = () => {
  const { syncHeight, isSyncing } = useSyncState();
  const { networkId } = useNetwork();
  const { accounts, syncingState, submittingTransaction } = useGlobalContext();
  const { syncState, popState } = useAppState();
  const { exampleId, loadExample } = useExamples();
  const exampleAccount = accounts.find(({ components }) =>
    components.includes(exampleId),
  );
  const useIntervalTriggered =
    networkId !== "mmck" &&
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
