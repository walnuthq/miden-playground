import { Alert } from "@workspace/ui/components/alert";
import type { ReactNode } from "react";

const TutorialAlert = ({ children }: { children: ReactNode }) => (
  <Alert className="bg-muted/50">{children}</Alert>
);

export default TutorialAlert;
