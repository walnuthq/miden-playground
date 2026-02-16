import { type ReactNode } from "react";
import { MockWebClientProvider } from "@/components/mock-web-client-context";
import { WebClientProvider as InternalWebClientProvider } from "@/components/web-client-context";

const ExternalWebClientProvider = ({ children }: { children: ReactNode }) => (
  <MockWebClientProvider>
    <InternalWebClientProvider>{children}</InternalWebClientProvider>
  </MockWebClientProvider>
);

export default ExternalWebClientProvider;
