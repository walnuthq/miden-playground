import useGlobalContext from "@/components/global-context/hook";

// The script name carries the run id: the package name ends up in the storage
// slot names, hence in the account code, so every run deploys a contract whose
// code nobody verified before (the registry verifies by code).
const useScriptName = () => {
  const { tutorialRunId } = useGlobalContext();
  return `counter-account-${tutorialRunId}`;
};

export default useScriptName;
