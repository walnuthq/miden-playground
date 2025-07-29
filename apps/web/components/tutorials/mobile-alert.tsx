import { MonitorCheck } from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert";

const MobileAlert = () => (
  <Alert>
    <MonitorCheck />
    <AlertTitle>This tutorial is best viewed on a desktop browser.</AlertTitle>
    <AlertDescription>
      While the playground should be usable on mobile, please note that you'll
      have a better experience using a desktop browser. Click on the book icon
      above to toggle the tutorial panel.
    </AlertDescription>
  </Alert>
);

export default MobileAlert;
