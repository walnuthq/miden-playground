import { useNavigate } from "react-router";
import { NewSandboxCardView } from "@/components/home/new-sandbox-card-view";
import useAppState from "@/hooks/use-app-state";
import { trackEvent } from "@/lib/analytics";
import type { NetworkId } from "@/lib/types/network";
import { confirmWorkspaceSwitch } from "@/lib/utils/workspace-guard";

const NewSandboxCard = ({ networkId }: { networkId: NetworkId }) => {
  const navigate = useNavigate();
  const { resetState } = useAppState();
  return (
    <NewSandboxCardView
      networkId={networkId}
      onCreate={async () => {
        if (await confirmWorkspaceSwitch()) {
          resetState(networkId);
          trackEvent("new_sandbox", { network_id: networkId });
          navigate("/accounts");
        }
      }}
    />
  );
};

export default NewSandboxCard;
