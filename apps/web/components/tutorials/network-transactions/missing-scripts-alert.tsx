import MissingScriptsAlert from "@/components/tutorials/missing-scripts-alert";
import useNetworkCounter from "@/components/tutorials/network-transactions/use-network-counter";

// The steps need the counter example's two scripts (index.ts).
const NetworkMissingScriptsAlert = () => {
  const { noteScript, counterScript } = useNetworkCounter();
  return (
    <MissingScriptsAlert
      tutorialId="network-transactions"
      loaded={!!noteScript && !!counterScript}
      scripts="the counter's scripts"
    />
  );
};

export default NetworkMissingScriptsAlert;
