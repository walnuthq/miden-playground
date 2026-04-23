import { useContext } from "react";
import { NetworkContext } from "@/components/providers/network-provider";

const useNetwork = () => {
  const { networkId, switchNetwork } = useContext(NetworkContext);
  return { networkId, switchNetwork };
};

export default useNetwork;
