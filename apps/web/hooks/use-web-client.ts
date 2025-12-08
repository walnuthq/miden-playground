import { useContext } from "react";
import {
  WebClientContext,
  createClient,
} from "@/components/web-client-context";
import {
  clientGetAllInputNotes,
  clientGetConsumableNotes,
  wasmAccountToAccount,
  clientGetAccountById,
} from "@/lib/web-client";
import useMidenSdk from "@/hooks/use-miden-sdk";
import { type Account } from "@/lib/types/account";
import { type NetworkId } from "@/lib/types/network";
import useGlobalContext from "@/components/global-context/hook";
import { type State, defaultState } from "@/lib/types/state";
import { type Store, deleteStore, defaultStore } from "@/lib/types/store";
import { MIDEN_FAUCET_ADDRESS } from "@/lib/constants";

const useWebClient = () => {
  const { client } = useContext(WebClientContext);
  const { midenSdk } = useMidenSdk();
  const {
    networkId,
    accounts: previousAccounts,
    inputNotes: previousInputNotes,
    nextState,
    nextStore,
    completedTutorials,
    dispatch,
  } = useGlobalContext();
  const syncState = async () => {
    dispatch({ type: "SYNCING_STATE", payload: { syncingState: true } });
    try {
      const syncSummary = await client.syncState();
      const inputNotes = await clientGetAllInputNotes({
        client,
        previousInputNotes,
        midenSdk,
      });
      const accounts: Account[] = [];
      for (const previousAccount of previousAccounts) {
        if (previousAccount.address === MIDEN_FAUCET_ADDRESS) {
          accounts.push(previousAccount);
          continue;
        }
        const wasmAccount = await clientGetAccountById({
          client,
          accountId: previousAccount.id,
          midenSdk,
        });
        const consumableNotes = await clientGetConsumableNotes({
          client,
          accountId: previousAccount.id,
          midenSdk,
        });
        const consumableNoteIds = consumableNotes.map((consumableNote) =>
          consumableNote.inputNoteRecord().id().toString()
        );
        const account = wasmAccountToAccount({
          wasmAccount,
          name: previousAccount.name,
          components: previousAccount.components,
          networkId,
          updatedAt: syncSummary.blockNum(),
          consumableNoteIds,
          midenSdk,
        });
        accounts.push(account);
      }
      dispatch({
        type: "SYNC_STATE",
        payload: {
          blockNum: syncSummary.blockNum(),
          accounts,
          inputNotes,
        },
      });
    } catch (error) {
      console.error("ERROR: SyncState", error);
      dispatch({ type: "SYNCING_STATE", payload: { syncingState: false } });
    }
  };
  const pushState = ({
    pushedState,
    pushedStore = defaultStore(),
  }: {
    pushedState: State;
    pushedStore?: Store;
  }) =>
    dispatch({
      type: "PUSH_STATE",
      payload: { nextState: pushedState, nextStore: pushedStore },
    });
  const popState = async () => {
    if (!nextState || !nextStore) {
      return;
    }
    await deleteStore();
    const newClient = await createClient({
      networkId: nextState.networkId,
      serializedMockChain: nextState.serializedMockChain,
      midenSdk,
    });
    await newClient.forceImportStore(JSON.stringify(nextStore));
    const syncSummary = await newClient.syncState();
    dispatch({
      type: "POP_STATE",
      payload: { blockNum: syncSummary.blockNum() },
    });
  };
  const resetState = async (newNetworkId: NetworkId) =>
    pushState({
      pushedState: {
        ...defaultState(),
        networkId: newNetworkId,
        completedTutorials,
      },
    });
  return { client, syncState, pushState, popState, resetState };
};

export default useWebClient;
