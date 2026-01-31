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
  addressToAccountId,
} from "@/lib/web-client";
import useMidenSdk from "@/hooks/use-miden-sdk";
import { accountIdFromPrefixSuffix, type Account } from "@/lib/types/account";
import { type NetworkId } from "@/lib/types/network";
import useGlobalContext from "@/components/global-context/hook";
import { type State, defaultState } from "@/lib/types/state";
import { type Store, deleteStore, defaultStore } from "@/lib/types/store";
import { MIDEN_FAUCET_ADDRESS, P2ID_NOTE_CODE } from "@/lib/constants";
import { useWallet } from "@demox-labs/miden-wallet-adapter";
// import { useParaMiden } from "@/lib/para-miden";

const useWebClient = () => {
  const { client: defaultClient } = useContext(WebClientContext);
  // const { client: paraMidenClient } = useParaMiden();
  // const client = paraMidenClient ?? defaultClient;
  const client = defaultClient;
  const { address, requestAssets } = useWallet();
  const { midenSdk } = useMidenSdk();
  const {
    networkId,
    accounts: previousAccounts,
    inputNotes: previousInputNotes,
    scripts,
    nextState,
    nextStore,
    tutorialId,
    completedTutorials,
    dispatch,
  } = useGlobalContext();
  const syncState = async () => {
    dispatch({ type: "SYNCING_STATE", payload: { syncingState: true } });
    try {
      const syncSummary = await client.syncState();
      if (!tutorialId || tutorialId === "private-transfers") {
        try {
          await client.fetchPrivateNotes();
        } catch (error) {
          console.error(error);
        }
      }
      const inputNotes = await clientGetAllInputNotes({
        client,
        previousInputNotes,
        scripts,
        midenSdk,
      });
      const consumableP2IDNotes = inputNotes.filter(
        ({ state, scriptRoot }) =>
          !state.includes("consumed") && scriptRoot === P2ID_NOTE_CODE,
      );
      const accounts: Account[] = [];
      for (const previousAccount of previousAccounts) {
        // never update the Miden Faucet for better performance
        if (previousAccount.address === MIDEN_FAUCET_ADDRESS) {
          accounts.push(previousAccount);
          continue;
        }
        if (previousAccount.address === address) {
          const connectedWalletConsumableP2IDNotes = previousInputNotes.filter(
            ({ state, scriptRoot, inputs }) => {
              const [suffix = "", prefix = ""] = inputs;
              const targetAccountId = accountIdFromPrefixSuffix(prefix, suffix);
              return (
                !state.includes("consumed") &&
                scriptRoot === P2ID_NOTE_CODE &&
                targetAccountId === previousAccount.id
              );
            },
          );
          // handle new public accounts updates
          if (
            previousAccount.storageMode === "public" &&
            previousAccount.isNew
          ) {
            inputNotes.push(
              ...connectedWalletConsumableP2IDNotes.filter(
                ({ id }) => !inputNotes.find((note) => note.id === id),
              ),
            );
            accounts.push({
              ...previousAccount,
              consumableNoteIds: connectedWalletConsumableP2IDNotes.map(
                ({ id }) => id,
              ),
            });
            continue;
          }
          // handle private accounts updates
          if (previousAccount.storageMode === "private") {
            const assets = await requestAssets?.();
            accounts.push({
              ...previousAccount,
              consumableNoteIds: connectedWalletConsumableP2IDNotes.map(
                ({ id }) => id,
              ),
              fungibleAssets: assets
                ? assets.map(({ faucetId, amount }) => ({
                    faucetId: addressToAccountId({
                      address: faucetId,
                      midenSdk,
                    }).toString(),
                    amount,
                  }))
                : previousAccount.fungibleAssets,
            });
            continue;
          }
        }
        try {
          const wasmAccount = await clientGetAccountById({
            client,
            accountId: previousAccount.id,
            midenSdk,
          });
          // TODO this is unreliable for some reason?
          const consumableNotes = await clientGetConsumableNotes({
            client,
            accountId: previousAccount.id,
            midenSdk,
          });
          const consumableNoteIds = consumableNotes.map((consumableNote) =>
            consumableNote.inputNoteRecord().id().toString(),
          );
          const consumableP2IDNoteIds = consumableP2IDNotes
            .filter(({ inputs }) => {
              const [suffix = "", prefix = ""] = inputs;
              const targetAccountId = accountIdFromPrefixSuffix(prefix, suffix);
              return targetAccountId === previousAccount.id;
            })
            .map(({ id }) => id);
          consumableNoteIds.push(
            ...consumableP2IDNoteIds.filter(
              (id) => !consumableNoteIds.includes(id),
            ),
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
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
          accounts.push(previousAccount);
          continue;
        }
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
