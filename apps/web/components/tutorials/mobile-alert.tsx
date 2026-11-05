import { AlertDescription, AlertTitle } from "@workspace/ui/components/alert";
import { MonitorCheck } from "lucide-react";
import TutorialAlert from "@/components/tutorials/tutorial-alert";

const MobileAlert = () => (
  <TutorialAlert>
    <MonitorCheck />
    <AlertTitle>This tutorial is best viewed on a desktop browser.</AlertTitle>
    <AlertDescription>
      While the playground should be usable on mobile, please note that you'll
      have a better experience using a desktop browser. Close this panel to
      follow a step in the playground, and tap the bar at the bottom of the
      screen to open it again: it reopens by itself once a step is done. The
      code editor is read-only on phones: steps that change code have buttons
      that add it for you.
    </AlertDescription>
  </TutorialAlert>
);

export default MobileAlert;
