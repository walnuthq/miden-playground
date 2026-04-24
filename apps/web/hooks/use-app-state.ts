"use client";
import {
  Address as WasmAddress,
  AccountId as WasmAccountId,
} from "@miden-sdk/miden-sdk";
import {
  clientGetAllInputNotes,
  wasmAccountToAccount,
  clientGetConsumableNotes,
} from "@/lib/web-client";
import type { Account } from "@/lib/types/account";
import {
  accountIdFromPrefixSuffix,
  midenFaucetAccount,
} from "@/lib/utils/account";
import type { NetworkId } from "@/lib/types/network";
import useGlobalContext from "@/components/global-context/hook";
import type { State } from "@/lib/types/state";
import { defaultState } from "@/lib/utils/state";
import { noteConsumed } from "@/lib/utils/note";
import { P2ID_NOTE_CODE, midenFaucetAddress } from "@/lib/constants";
import { useWallet } from "@miden-sdk/miden-wallet-adapter";
import { storeName, defaultStore } from "@/lib/utils/store";
import type { NoteState } from "@/lib/types/note";
// import { useParaMiden } from "@/lib/para-miden";
import {
  useMiden,
  useSyncState,
  clearMidenStorage,
  useImportStore,
} from "@miden-sdk/react";
import useNetwork from "@/hooks/use-network";

const useAppState = () => {
  const { networkId, switchNetwork } = useNetwork();
  const { client } = useMiden();
  const { importStore } = useImportStore();
  const { lastSyncTime } = useSyncState();
  // const { client: paraMidenClient } = useParaMiden();
  // const client = paraMidenClient ?? defaultClient;
  const { wallet, address: midenWalletAddress, requestAssets } = useWallet();
  const {
    accounts: previousAccounts,
    inputNotes: previousInputNotes,
    scripts,
    nextState,
    tutorialId,
    completedTutorials,
    dispatch,
  } = useGlobalContext();
  const syncState = async () => {
    if (!client) {
      return;
    }
    dispatch({ type: "SYNCING_STATE", payload: { syncingState: true } });
    try {
      if (tutorialId === "" || tutorialId === "private-transfers") {
        try {
          await client.fetchPrivateNotes();
        } catch (error) {
          console.error("ERROR: fetchPrivateNotes", error);
        }
      }
      const inputNotes = await clientGetAllInputNotes({
        client,
        networkId,
        previousInputNotes,
        scripts,
        updatedAt: lastSyncTime,
      });
      const consumableP2IDNotes = inputNotes.filter(
        (inputNote) =>
          !noteConsumed(inputNote) && inputNote.scriptRoot === P2ID_NOTE_CODE,
      );
      const accounts: Account[] = [];
      for (const previousAccount of previousAccounts) {
        // never update the Miden Faucet for better performance
        if (midenFaucetAddress(networkId) === previousAccount.address) {
          accounts.push(previousAccount);
          continue;
        }
        const previousAccountP2IDNotes = previousInputNotes.filter(
          ({ scriptRoot, storage }) => {
            const [suffix = "", prefix = ""] = storage;
            const targetAccountId = accountIdFromPrefixSuffix(prefix, suffix);
            return (
              scriptRoot === P2ID_NOTE_CODE &&
              targetAccountId === previousAccount.id
            );
          },
        );
        const previousAccountConsumableP2IDNotes =
          previousAccountP2IDNotes.filter(
            (inputNote) => !noteConsumed(inputNote),
          );
        if (previousAccount.multisig) {
          const pendingConsumableNotesProposalsNoteIds =
            previousAccount.multisig.proposals.reduce<string[]>(
              (previousValue, currentValue) =>
                ["pending", "ready"].includes(currentValue.status) &&
                currentValue.metadata.proposalType === "consume_notes"
                  ? [...previousValue, ...currentValue.metadata.noteIds]
                  : previousValue,
              [],
            );
          accounts.push({
            ...previousAccount,
            consumableNoteIds: previousAccountConsumableP2IDNotes
              .filter(
                ({ id }) =>
                  !pendingConsumableNotesProposalsNoteIds.includes(id),
              )
              .map(({ id }) => id),
          });
          continue;
        }
        if (previousAccount.address === midenWalletAddress) {
          const isNewPublicAccount =
            previousAccount.storageMode === "public" && previousAccount.isNew;
          // always re-add notes targetting connected wallet
          inputNotes.push(
            ...previousAccountP2IDNotes
              .filter(({ id }) => !inputNotes.find((note) => note.id === id))
              .map((note) => ({
                ...note,
                state: isNewPublicAccount
                  ? ("committed" as NoteState)
                  : ("consumed-external" as NoteState),
              })),
          );
          // handle new public accounts updates
          if (isNewPublicAccount) {
            accounts.push({
              ...previousAccount,
              consumableNoteIds: previousAccountConsumableP2IDNotes.map(
                ({ id }) => id,
              ),
            });
            //continue;
          }
          // handle private accounts updates
          if (previousAccount.storageMode === "private") {
            const assets = wallet && requestAssets ? await requestAssets() : [];
            accounts.push({
              ...previousAccount,
              consumableNoteIds: previousAccountConsumableP2IDNotes.map(
                ({ id }) => id,
              ),
              fungibleAssets: assets
                ? assets.map(({ faucetId, amount }) => ({
                    faucetId: WasmAddress.fromBech32(faucetId)
                      .accountId()
                      .toString(),
                    amount,
                  }))
                : previousAccount.fungibleAssets,
            });
            continue;
          }
        }
        try {
          let wasmAccount = await client.getAccount(
            WasmAccountId.fromHex(previousAccount.id),
          );
          if (!wasmAccount) {
            await client.importAccountById(
              WasmAccountId.fromHex(previousAccount.id),
            );
            wasmAccount = await client.getAccount(
              WasmAccountId.fromHex(previousAccount.id),
            );
            if (!wasmAccount) {
              throw new Error("Account not found");
            }
          }
          // TODO this is unreliable for some reason?
          const consumableNotes = await clientGetConsumableNotes({
            client,
            accountId: previousAccount.id,
          });
          const consumableNoteIds = consumableNotes.map((consumableNote) =>
            consumableNote.inputNoteRecord().id().toString(),
          );
          const consumableP2IDNoteIds = consumableP2IDNotes
            .filter(({ storage }) => {
              const [suffix = "", prefix = ""] = storage;
              const targetAccountId = accountIdFromPrefixSuffix(prefix, suffix);
              return targetAccountId === previousAccount.id;
            })
            .map(({ id }) => id);
          consumableNoteIds.push(
            ...consumableP2IDNoteIds.filter(
              (id) => !consumableNoteIds.includes(id),
            ),
          );
          const addressNoteTag = WasmAddress.fromBech32(
            previousAccount.address,
          ).toNoteTag();
          const consumableInputNoteIds = inputNotes
            .filter(
              (inputNote) =>
                !noteConsumed(inputNote) &&
                inputNote.tag === addressNoteTag.asU32().toString(),
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
            updatedAt: lastSyncTime,
            consumableNoteIds,
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
          accounts,
          inputNotes,
        },
      });
    } catch (error) {
      console.error("ERROR: syncState", error);
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
    await clearMidenStorage();
    await importStore(
      JSON.stringify(nextState.nextStore ?? defaultStore(networkId)),
      storeName(networkId),
    );
    dispatch({ type: "POP_STATE" });
  };
  const resetState = async (newNetworkId: NetworkId) => {
    switchNetwork(newNetworkId);
    // console.log(newNetworkId, midenFaucetAccount(newNetworkId));
    // await sleep(1000);
    pushState({
      ...defaultState(),
      accounts: [midenFaucetAccount(newNetworkId)],
      completedTutorials,
    });
  };
  return {
    syncState,
    pushState,
    popState,
    resetState,
  };
};

export default useAppState;
