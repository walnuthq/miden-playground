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
import { toast } from "sonner";
import GlobalContext from "@/components/global-context";
import AppShell from "@/components/lib/app-shell";
import Logo from "@/components/lib/logo";
import useNetwork from "@/hooks/use-network";
import { networks, noteTransportUrls, provers } from "@/lib/miden-client";
import {
  deleteMockChain,
  MOCK_CHAIN_BUSY_MESSAGE,
  onMockClientCrash,
} from "@/lib/mock-chain";
import type { NetworkId } from "@/lib/types/network";
import { deleteProjects } from "@/lib/utils/project";
import { defaultState, STATE_STORAGE_KEY } from "@/lib/utils/state";
import {
  deleteMidenStores,
  deleteOutdatedMidenStores,
  storeName,
} from "@/lib/utils/store";

const resetLocalData = async () => {
  await deleteMidenStores();
  // The MockChain's store went with the others: its chain goes too.
  await deleteMockChain().catch((error) =>
    console.error("ERROR: deleteMockChain", error),
  );
  await deleteProjects();
  localStorage.removeItem(STATE_STORAGE_KEY);
  window.location.reload();
};

// Since 0.17.4 the SDK refuses to open a store written by a newer client
// (e.g. after a rollback) rather than resetting it, and deletes nothing.
const isNewerStoreError = (error: Error) =>
  error.message.includes("written by a newer Miden client");

// The saved chain couldn't be loaded, or its client crashes on every start
// (`lib/mock-chain.ts`).
const isMockChainError = (error: Error) => error.message.includes("MockChain");

// Another tab runs the MockChain sandbox (`mockChainTabLock`). Nothing is
// wrong with the stored data, which is that tab's: no reset is offered.
const isMockChainBusyError = (error: Error) =>
  error.message.includes(MOCK_CHAIN_BUSY_MESSAGE);

const MockChainBusy = ({ error }: { error: Error }) => (
  <Empty className="h-screen">
    <EmptyHeader>
      <EmptyMedia variant="icon">
        <Logo className="size-8" />
      </EmptyMedia>
      <EmptyTitle>Failed to initialize: {error.message}</EmptyTitle>
      <EmptyDescription className="max-w-md text-pretty">
        A MockChain lives in the memory of the tab that runs it, so one tab at a
        time can open the sandbox. Close the other tab, or start another sandbox
        there, then retry.
      </EmptyDescription>
    </EmptyHeader>
    <EmptyContent>
      <Button onClick={() => window.location.reload()}>Retry</Button>
    </EmptyContent>
  </Empty>
);

const InitializationError = ({ error }: { error: Error }) => {
  const [loading, setLoading] = useState(false);
  if (isMockChainBusyError(error)) {
    return <MockChainBusy error={error} />;
  }
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
            : isMockChainError(error)
              ? "The MockChain this browser stores and the accounts of its sandbox no longer match."
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
  // The MockChain client's worker crashed: `restarts` counts the clients
  // started in its place, `mockClientError` is set once restarting is given up.
  const [restarts, setRestarts] = useState(0);
  const [mockClientError, setMockClientError] = useState<Error | null>(null);
  // biome-ignore lint/correctness/useExhaustiveDependencies: a restart needs a new config object, which is what makes the SDK's provider create a client.
  const config = useMemo(
    () => ({
      rpcUrl: networks[networkId],
      noteTransportUrl: noteTransportUrls[networkId],
      autoSyncInterval: 5000,
      prover: provers[networkId],
    }),
    [networkId, restarts],
  );
  useEffect(
    () =>
      onMockClientCrash(({ action }) => {
        if (action === "give-up") {
          setMockClientError(new Error("the MockChain client keeps crashing"));
          return;
        }
        toast.error("The MockChain client crashed.", {
          description:
            "It was restarted on the last block. Asking the MockChain for an account it doesn't hold does this.",
        });
        setRestarts((count) => count + 1);
      }),
    [],
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
          // Saved projects come from the same outdated client, and so does
          // the chain of a MockChain store.
          return Promise.all([
            deleteProjects(),
            outdatedStores.includes(storeName("mmck")) && deleteMockChain(),
          ]);
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
  if (mockClientError) {
    return <InitializationError error={mockClientError} />;
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
