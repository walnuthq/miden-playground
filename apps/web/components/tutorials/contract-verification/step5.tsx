import { EllipsisVertical } from "lucide-react";
import useScriptName from "@/components/tutorials/contract-verification/use-script-name";
import TutorialLink from "@/components/tutorials/tutorial-link";
import type { TutorialStep } from "@/lib/types/tutorial";

const Step5Content = ({ scriptName }: { scriptName: string }) => (
  <>
    <p>
      The imported contract was built from the exact same script as the counter
      contract you deployed, so let's export your script to download its source
      code.
    </p>
    <p>
      Head to the <TutorialLink href="/scripts">scripts page</TutorialLink>,
      click the <EllipsisVertical className="size-4 inline" /> icon button at
      the end of the <strong>{scriptName}</strong> script's row and select the{" "}
      <em>"Export script"</em> option to download it.
    </p>
    <p>
      Unzip the downloaded <strong>{scriptName}.zip</strong> archive into a
      folder: it contains a complete Miden project that you could also build
      locally. Feel free to explore it, but don't modify any file, or you won't
      be able to verify the contract in the next step.
    </p>
  </>
);

const Step5: TutorialStep = {
  title: "Export the counter contract script.",
  Content: () => {
    const scriptName = useScriptName();
    return <Step5Content scriptName={scriptName} />;
  },
};

export default Step5;
