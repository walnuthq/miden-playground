import { MidenProvider as RawMidenProvider, useMiden } from "@miden-sdk/react";
import { Button } from "@workspace/ui/components/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty";
import {
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import GlobalContext from "@/components/global-context";
import AppShell from "@/components/lib/app-shell";
import Logo from "@/components/lib/logo";
import useNetwork from "@/hooks/use-network";
import { networks, noteTransportUrls, provers } from "@/lib/miden-client";
import type { NetworkId } from "@/lib/types/network";
import { deleteProjects } from "@/lib/utils/project";
import { defaultState, STATE_STORAGE_KEY } from "@/lib/utils/state";
import {
  deleteMidenStores,
  deleteOutdatedMidenStores,
} from "@/lib/utils/store";

const resetLocalData = async () => {
  await deleteMidenStores();
  await deleteProjects();
  localStorage.removeItem(STATE_STORAGE_KEY);
  window.location.reload();
};

// Since 0.17.4 the SDK refuses to open a store written by a newer client
// (e.g. after a rollback) rather than resetting it, and deletes nothing.
const isNewerStoreError = (error: Error) =>
  error.message.includes("written by a newer Miden client");

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
          {isNewerStoreError(error)
            ? "The data this browser stores for the playground was written by a newer version, which this one cannot read."
            : "The data this browser stores for the playground may have been written by an older version."}{" "}
          Resetting it deletes the local accounts, notes and transactions, and
          the saved tutorial progress, then reloads the page.
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
  const { globalDispatch: dispatch } = useContext(GlobalContext);
  const [storeChecked, setStoreChecked] = useState(false);
  // Memoized: the SDK's provider re-initializes the client whenever the
  // config object changes, and this component re-renders on every app state
  // change (it reads the global context).
  const config = useMemo(
    () => ({
      rpcUrl: networks[networkId],
      noteTransportUrl: noteTransportUrls[networkId],
      autoSyncInterval: 5000,
      prover: provers[networkId],
    }),
    [networkId],
  );
  // Has to settle before `RawMidenProvider` mounts, since that is what opens
  // the store and, with it, upgrades away the only marker saying the store
  // predates 0.16, or clears a store a pre-0.17 SDK wrote. Dropping the
  // persisted state alongside it keeps the accounts the UI lists in step with
  // the store that backs them.
  useEffect(() => {
    deleteOutdatedMidenStores()
      .then((outdatedStores) => {
        if (outdatedStores.length > 0) {
          // GlobalContextProvider, above this one, has already loaded the
          // persisted state: reset it in memory (and in storage) too.
          dispatch({
            type: "POP_STATE",
            payload: { imported: defaultState() },
          });
          // Saved projects come from the same outdated client.
          return deleteProjects();
        }
      })
      .catch((error) =>
        console.error("ERROR: deleteOutdatedMidenStores", error),
      )
      .finally(() => setStoreChecked(true));
    // `dispatch` is stable: this runs once.
  }, [dispatch]);
  if (!storeChecked) {
    return <AppShell />;
  }
  // No `loadingComponent`: it would stand in for the children, the signer
  // providers included, while the client initializes, so a network switch
  // would remount them all. MidenClientGate, below them, holds the page back
  // instead.
  return (
    <RawMidenProvider
      config={config}
      errorComponent={(error) => <InitializationError error={error} />}
    >
      {children}
    </RawMidenProvider>
  );
};

export default MidenProvider;

type Client = ReturnType<typeof useMiden>["client"];

// Shows the app shell in place of the page while the Miden client initializes:
// on load, and again on every network switch, which re-initializes it. The
// providers between MidenProvider and this gate stay mounted meanwhile. (As
// the SDK provider's `loadingComponent`, the shell replaced them too: Para's
// provider then redid its setup on every remount, and showed its fallback, the
// shell, a few hundred ms after the page was back, closing any menu opened in
// between.)
//
// Keyed on the network as well as on the client: the SDK provider only flags
// the initialization a tick after its config changed, and the page would
// otherwise render once more with the old client and the new network.
export const MidenClientGate = ({ children }: { children: ReactNode }) => {
  const { client, isReady, isInitializing } = useMiden();
  const { networkId } = useNetwork();
  // The client the page runs on, and the network it was created for.
  const [current, setCurrent] = useState<{
    client: Client;
    networkId: NetworkId;
  }>({ client, networkId });
  if (client !== current.client) {
    setCurrent({ client, networkId });
  }
  if (
    !isReady ||
    isInitializing ||
    client !== current.client ||
    networkId !== current.networkId
  ) {
    return <AppShell />;
  }
  return children;
};
