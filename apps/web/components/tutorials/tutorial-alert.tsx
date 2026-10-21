import type { ReactNode } from "react";
import { Alert } from "@workspace/ui/components/alert";

const TutorialAlert = ({ children }: { children: ReactNode }) => (
  <Alert className="bg-muted/50">{children}</Alert>
);

export default TutorialAlert;
