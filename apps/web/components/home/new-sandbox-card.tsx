import { useNavigate } from "react-router";
import { NewSandboxCardView } from "@/components/home/new-sandbox-card-view";
import useAppState from "@/hooks/use-app-state";
import type { NetworkId } from "@/lib/types/network";

const NewSandboxCard = ({ networkId }: { networkId: NetworkId }) => {
  const navigate = useNavigate();
  const { resetState } = useAppState();
  return (
    <NewSandboxCardView
      networkId={networkId}
      onCreate={() => {
        resetState(networkId);
        navigate("/accounts");
      }}
    />
  );
};

export default NewSandboxCard;
