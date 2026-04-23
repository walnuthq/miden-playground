import { useEffect } from "react";
import { useInterval } from "usehooks-ts";
import { CircleDot } from "lucide-react";
import { Badge } from "@workspace/ui/components/badge";
import { Spinner } from "@workspace/ui/components/spinner";
import useGlobalContext from "@/components/global-context/hook";
import { networks } from "@/lib/types/network";
import { cn } from "@workspace/ui/lib/utils";
import useAppState from "@/hooks/use-app-state";
import { useSyncState } from "@miden-sdk/react";
import useNetwork from "@/hooks/use-network";

let callingPopState = false;

const NetworkBadge = () => {
  const { syncHeight, isSyncing } = useSyncState();
  const { networkId } = useNetwork();
  const { syncingState, submittingTransaction } = useGlobalContext();
  const { syncState, popState } = useAppState();
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
  const variants = {
    mtst: "default",
    mdev: "secondary",
    mlcl: "destructive",
    mmck: "default",
  } as const;
  return (
    <Badge
      variant={variants[networkId]}
      className={cn("rounded-xs h-8", {
        "bg-[#f50] text-white": networkId === "mmck",
      })}
    >
      {networks[networkId]} | <pre>#{syncHeight}</pre>
      {isSyncing ? <Spinner /> : <CircleDot />}
    </Badge>
  );
};

export default NetworkBadge;
