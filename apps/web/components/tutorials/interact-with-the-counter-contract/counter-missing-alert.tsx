import useCounterScript from "@/components/tutorials/interact-with-the-counter-contract/use-counter-script";
import MissingScriptsAlert from "@/components/tutorials/missing-scripts-alert";

// The steps need the counter-account script the starter adds (index.ts).
const CounterMissingAlert = () => {
  const counterScript = useCounterScript();
  return (
    <MissingScriptsAlert
      tutorialId="interact-with-the-counter-contract"
      loaded={!!counterScript}
      scripts="the counter contract's script"
    />
  );
};

export default CounterMissingAlert;
