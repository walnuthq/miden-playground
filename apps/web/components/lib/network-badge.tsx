import { useEffect } from "react";
import { useInterval } from "usehooks-ts";
import { CircleDot } from "lucide-react";
import { Badge } from "@workspace/ui/components/badge";
import { Spinner } from "@workspace/ui/components/spinner";
import useGlobalContext from "@/components/global-context/hook";
import { networks } from "@/lib/types/network";
import { cn } from "@workspace/ui/lib/utils";
import useWebClient from "@/hooks/use-web-client";

const NetworkBadge = () => {
  const { networkId, blockNum, syncingState, submittingTransaction } =
    useGlobalContext();
  const { syncState, popState } = useWebClient();
  const useIntervalTriggered = !syncingState && networkId === "mtst";
  useInterval(
    () => {
      if (!submittingTransaction) {
        syncState();
      }
    },
    useIntervalTriggered ? 5000 : null
  );
  useEffect(() => {
    if (!syncingState) {
      popState();
    }
  }, [syncingState, popState]);
  return (
    <Badge className={cn({ "bg-[#f50] text-white": networkId === "mlcl" })}>
      {networks[networkId]} | <pre>#{blockNum}</pre>
      {syncingState ? <Spinner /> : <CircleDot />}
    </Badge>
  );
};

export default NetworkBadge;
