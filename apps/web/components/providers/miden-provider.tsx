import { type ReactNode } from "react";
import { MidenProvider as RawMidenProvider } from "@miden-sdk/react";
import useNetwork from "@/hooks/use-network";
import { networks, noteTransportUrls } from "@/lib/miden-client";
import Loading from "@/components/lib/loading";

const MidenProvider = ({ children }: { children: ReactNode }) => {
  const { networkId } = useNetwork();
  return (
    <RawMidenProvider
      config={{
        rpcUrl: networks[networkId],
        noteTransportUrl: noteTransportUrls[networkId],
        autoSyncInterval: 5000,
        prover: networks[networkId],
      }}
      loadingComponent={<Loading />}
      errorComponent={(error) => (
        <div>Failed to initialize: {error.message}</div>
      )}
    >
      {children}
    </RawMidenProvider>
  );
};

export default MidenProvider;
