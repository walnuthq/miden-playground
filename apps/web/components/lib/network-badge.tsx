import { useState } from "react";
import { useInterval } from "usehooks-ts";
import { CircleDot } from "lucide-react";
import { Badge } from "@workspace/ui/components/badge";
import { Spinner } from "@workspace/ui/components/spinner";
import useGlobalContext from "@/components/global-context/hook";
import { networks } from "@/lib/types/network";
import { cn } from "@workspace/ui/lib/utils";
import useWebClient from "@/hooks/use-web-client";

const NetworkBadge = () => {
  const { networkId, blockNum } = useGlobalContext();
  const { syncState } = useWebClient();
  const [loading, setLoading] = useState(false);
  const useIntervalTriggered = !loading && networkId === "mtst";
  useInterval(
    () => {
      const sync = async () => {
        setLoading(true);
        await syncState();
        setLoading(false);
      };
      sync();
    },
    useIntervalTriggered ? 4000 : null
  );
  return (
    <Badge className={cn({ "bg-[#f50] text-white": networkId === "mlcl" })}>
      {networks[networkId]} | <pre>#{blockNum}</pre>
      {loading ? <Spinner /> : <CircleDot />}
    </Badge>
  );
};

export default NetworkBadge;
