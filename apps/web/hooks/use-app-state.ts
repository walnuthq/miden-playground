"use client";
import {
  clientGetAllInputNotes,
  clientGetConsumableNotes,
  wasmAccountToAccount,
  clientGetAccountById,
  addressToAccountId,
} from "@/lib/web-client";
import useMidenSdk from "@/hooks/use-miden-sdk";
import useWebClient from "@/hooks/use-web-client";
import { accountIdFromPrefixSuffix, type Account } from "@/lib/types/account";
import { type NetworkId } from "@/lib/types/network";
import useGlobalContext from "@/components/global-context/hook";
import { type State, defaultState } from "@/lib/types/state";
import { MIDEN_FAUCET_ADDRESS, P2ID_NOTE_CODE } from "@/lib/constants";
import { useWallet } from "@miden-sdk/miden-wallet-adapter";
import { deleteStore, storeName, defaultStore } from "@/lib/types/store";
import type { NoteState } from "@/lib/types/note";
// import { useParaMiden } from "@/lib/para-miden";

const useAppState = () => {
  const { midenSdk } = useMidenSdk();
  const { client } = useWebClient();
  // const { client: paraMidenClient } = useParaMiden();
  // const client = paraMidenClient ?? defaultClient;
  const { address, requestAssets } = useWallet();
  const {
    networkId,
    blockNum,
    accounts: previousAccounts,
    inputNotes: previousInputNotes,
    scripts,
    nextState,
    tutorialId,
    completedTutorials,
    dispatch,
  } = useGlobalContext();
  const mockWebClientInitializing = () =>
    dispatch({ type: "MOCK_WEB_CLIENT_INITIALIZING" });
  const mockWebClientInitialized = ({
    blockNum,
    serializedMockChain,
  }: {
    blockNum: number;
    serializedMockChain: Uint8Array;
  }) =>
    dispatch({
      type: "MOCK_WEB_CLIENT_INITIALIZED",
      payload: { blockNum, serializedMockChain },
    });
  const webClientInitializing = () =>
    dispatch({ type: "WEB_CLIENT_INITIALIZING" });
  const webClientInitialized = ({ blockNum }: { blockNum: number }) =>
    dispatch({
      type: "WEB_CLIENT_INITIALIZED",
      payload: { blockNum },
    });
  const syncState = async () => {
    if (!client) {
      // TODO client should always be truthy
      return;
    }
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
        networkId,
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
          const connectedWalletP2IDNotes = previousInputNotes.filter(
            ({ scriptRoot, inputs }) => {
              const [suffix = "", prefix = ""] = inputs;
              const targetAccountId = accountIdFromPrefixSuffix(prefix, suffix);
              return (
                scriptRoot === P2ID_NOTE_CODE &&
                targetAccountId === previousAccount.id
              );
            },
          );
          const isNewPublicAccount =
            previousAccount.storageMode === "public" && previousAccount.isNew;
          // always re-add notes targetting connected wallet
          inputNotes.push(
            ...connectedWalletP2IDNotes
              .filter(({ id }) => !inputNotes.find((note) => note.id === id))
              .map((note) => ({
                ...note,
                state: isNewPublicAccount
                  ? ("committed" as NoteState)
                  : ("consumed-external" as NoteState),
              })),
          );
          const connectedWalletConsumableP2IDNotes =
            connectedWalletP2IDNotes.filter(
              ({ state }) => !state.includes("consumed"),
            );
          // handle new public accounts updates
          if (isNewPublicAccount) {
            accounts.push({
              ...previousAccount,
              consumableNoteIds: connectedWalletConsumableP2IDNotes.map(
                ({ id }) => id,
              ),
            });
            //continue;
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
          const addressNoteTag = midenSdk.Address.fromBech32(
            previousAccount.address,
          ).toNoteTag();
          const consumableInputNoteIds = inputNotes
            .filter(
              ({ state, tag }) =>
                !state.includes("consumed") &&
                tag === addressNoteTag.asU32().toString(),
            )
            .map(({ id }) => id);
          consumableNoteIds.push(
            ...consumableInputNoteIds.filter(
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
          const accountIndex = accounts.findIndex(
            ({ id }) => id === previousAccount.id,
          );
          if (accountIndex === -1) {
            accounts.push(account);
          } else {
            accounts[accountIndex] = account;
          }
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
          const existingAccount = accounts.find(
            ({ id }) => id === previousAccount.id,
          );
          if (!existingAccount) {
            accounts.push(previousAccount);
          }
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
  const pushState = (nextState: State) =>
    dispatch({
      type: "PUSH_STATE",
      payload: { nextState },
    });
  const popState = async () => {
    if (!nextState) {
      return;
    }
    await deleteStore(nextState.networkId);
    if (networkId === nextState.networkId) {
      await client?.forceImportStore(
        JSON.stringify(nextState.nextStore ?? defaultStore()),
        storeName(networkId),
      );
    }
    dispatch({ type: "POP_STATE" });
  };
  const resetState = async (newNetworkId: NetworkId) =>
    pushState({
      ...defaultState(),
      networkId: newNetworkId,
      blockNum: newNetworkId === "mmck" ? 0 : blockNum,
      completedTutorials,
    });
  return {
    mockWebClientInitializing,
    mockWebClientInitialized,
    webClientInitializing,
    webClientInitialized,
    syncState,
    pushState,
    popState,
    resetState,
  };
};

export default useAppState;
