import useGlobalContext from "@/components/global-context/hook";
import { runTag } from "@/lib/utils/tutorial-code";

// The script's name carries the run id, so that the steps find the script the
// user created for this run by name.
const useScriptName = () => {
  const { tutorialRunId } = useGlobalContext();
  return `counter-account-${tutorialRunId}`;
};

// The number `reset_count` pushes (lib/utils/tutorial-code.ts): unique to the
// run, it makes the procedure's code, hence the contract's, one nobody
// verified before (the registry verifies by code, and in MASM the script's
// name doesn't reach the code).
export const useRunTag = () => {
  const { tutorialRunId } = useGlobalContext();
  return runTag(tutorialRunId);
};

export default useScriptName;
