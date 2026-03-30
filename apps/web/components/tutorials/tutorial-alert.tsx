import { type ReactNode } from "react";
import { Alert } from "@workspace/ui/components/alert";

const TutorialAlert = ({ children }: { children: ReactNode }) => (
  <Alert className="bg-[#f9f9f9] border-black/20 *:data-[slot=alert-description]:text-black my-2">
    {children}
  </Alert>
);

export default TutorialAlert;
