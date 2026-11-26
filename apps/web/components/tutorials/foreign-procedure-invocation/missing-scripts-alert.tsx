import useCountReader from "@/components/tutorials/foreign-procedure-invocation/use-count-reader";
import MissingScriptsAlert from "@/components/tutorials/missing-scripts-alert";

// The steps need the two scripts the starter adds (index.ts).
const CountReaderMissingScriptsAlert = () => {
  const { countReaderScript, counterScript } = useCountReader();
  return (
    <MissingScriptsAlert
      tutorialId="foreign-procedure-invocation"
      loaded={!!countReaderScript && !!counterScript}
      scripts="the count-reader and counter-account scripts"
    />
  );
};

export default CountReaderMissingScriptsAlert;
