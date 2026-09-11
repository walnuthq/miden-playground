"use client";
import { type ReactNode, useEffect, useState } from "react";
import { MidenProvider as RawMidenProvider } from "@miden-sdk/react/lazy";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty";
import { Button } from "@workspace/ui/components/button";
import useNetwork from "@/hooks/use-network";
import { networks, noteTransportUrls } from "@/lib/miden-client";
import { deleteLegacyMidenStores, deleteMidenStores } from "@/lib/utils/store";
import { STATE_STORAGE_KEY } from "@/lib/utils/state";
import Logo from "@/components/lib/logo";
import Loading from "@/components/lib/loading";

const resetLocalData = async () => {
  await deleteMidenStores();
  localStorage.removeItem(STATE_STORAGE_KEY);
  window.location.reload();
};

const InitializationError = ({ error }: { error: Error }) => {
  const [loading, setLoading] = useState(false);
  return (
    <Empty className="h-screen">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Logo className="size-8" />
        </EmptyMedia>
        <EmptyTitle>Failed to initialize: {error.message}</EmptyTitle>
        <EmptyDescription className="max-w-md text-pretty">
          The data this browser stores for the playground may have been written
          by an older version. Resetting it deletes the local accounts, notes
          and transactions, then reloads the page.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button
          disabled={loading}
          onClick={() => {
            setLoading(true);
            resetLocalData();
          }}
        >
          {loading ? "Resetting…" : "Reset local data"}
        </Button>
      </EmptyContent>
    </Empty>
  );
};

const MidenProvider = ({ children }: { children: ReactNode }) => {
  const { networkId } = useNetwork();
  const [storeChecked, setStoreChecked] = useState(false);
  // Has to settle before `RawMidenProvider` mounts, since that is what opens
  // the store and, with it, upgrades away the only marker saying the store
  // predates 0.16. Dropping the persisted state alongside it keeps the accounts
  // the UI lists in step with the store that backs them.
  useEffect(() => {
    deleteLegacyMidenStores()
      .then((legacyStores) => {
        if (legacyStores.length > 0) {
          localStorage.removeItem(STATE_STORAGE_KEY);
        }
      })
      .catch((error) => console.error("ERROR: deleteLegacyMidenStores", error))
      .finally(() => setStoreChecked(true));
  }, []);
  if (!storeChecked) {
    return <Loading />;
  }
  return (
    <RawMidenProvider
      config={{
        rpcUrl: networks[networkId],
        noteTransportUrl: noteTransportUrls[networkId],
        autoSyncInterval: 5000,
        prover: networks[networkId],
      }}
      loadingComponent={<Loading />}
      errorComponent={(error) => <InitializationError error={error} />}
    >
      {children}
    </RawMidenProvider>
  );
};

export default MidenProvider;
