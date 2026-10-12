import type { TutorialStep } from "@/lib/types/tutorial";
import Step5Content from "@/components/tutorials/contract-verification/step5.mdx";
import useScriptName from "@/components/tutorials/contract-verification/use-script-name";

const Step5: TutorialStep = {
  title: "Export the counter contract script.",
  Content: () => {
    const scriptName = useScriptName();
    return <Step5Content scriptName={scriptName} />;
  },
};

export default Step5;
