import { Badge } from "@workspace/ui/components/badge";
import { Spinner } from "@workspace/ui/components/spinner";
import { CircleDot } from "lucide-react";
import { type NetworkId, networks } from "@/lib/types/network";

const variants = {
  mm: "default",
  mtst: "outline",
  mdev: "secondary",
  mlcl: "destructive",
  mmck: "default",
} as const;

// The network and its sync height, with a spinner while syncing. The app shell
// shows it without a height before the SDK loads and while the Miden client
// initializes: this module stays SDK-free (NetworkBadge, the container, uses
// the client's hooks).
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
