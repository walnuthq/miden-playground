"use client";
import { uniq /*, omit*/ } from "lodash";
import {
  Address as WasmAddress,
  // AccountId as WasmAccountId,
  type Account as WasmAccount,
  type InputNoteRecord as WasmInputNoteRecord,
  type TransactionRecord as WasmTransactionRecord,
} from "@miden-sdk/miden-sdk/lazy";
import {
  clientGetAccounts,
  clientGetAllInputNotes,
  clientGetAllTransactions,
  transactionStatus,
  wasmAccountToAccount,
  wasmInputNoteToInputNote,
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
import {
  P2ID_NOTE_CODE,
  midenFaucetAccountId,
  // midenFaucetAddress,
} from "@/lib/constants";
import { useWallet, type Asset } from "@miden-sdk/miden-wallet-adapter";
import { storeName, defaultStore } from "@/lib/utils/store";
import type { NoteState, InputNote } from "@/lib/types/note";
import type { Transaction } from "@/lib/types/transaction";
import type { Script } from "@/lib/types/script";
// import { useParaMiden } from "@/lib/para-miden";
import {
  useMiden,
  useSyncState,
  clearMidenStorage,
  useImportStore,
} from "@miden-sdk/react/lazy";
import useNetwork from "@/hooks/use-network";

const syncAccounts = ({
  previousAccounts,
  wasmAccounts,
  updatedAt,
  inputNotes,
  connectedWallet,
  midenWalletAssets,
}: {
  previousAccounts: Account[];
  wasmAccounts: WasmAccount[];
  updatedAt: number | null;
  inputNotes: InputNote[];
  connectedWallet?: Account;
  midenWalletAssets: Asset[];
}) => {
  const consumableP2IDNotes = inputNotes.filter(
    (inputNote) =>
      !noteConsumed(inputNote) && inputNote.scriptRoot === P2ID_NOTE_CODE,
  );
  const accountConsumableP2IDNoteIds = (accountId: string) =>
    consumableP2IDNotes
      .filter(({ storage }) => {
        const [suffix = "", prefix = ""] = storage;
        const targetAccountId = accountIdFromPrefixSuffix(prefix, suffix);
        return targetAccountId === accountId;
      })
      .map(({ id }) => id);
  const accounts = wasmAccounts.map((wasmAccount) => {
    const previousAccount = previousAccounts.find(
      ({ id }) => id === wasmAccount.id().toString(),
    );
    if (!previousAccount) {
      return;
    }
    const consumableP2IDNoteIds = accountConsumableP2IDNoteIds(
      previousAccount.id,
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
    const consumableNoteIds = uniq([
      ...consumableP2IDNoteIds,
      ...consumableInputNoteIds,
    ]);
    return wasmAccountToAccount({
      wasmAccount,
      name: previousAccount.name,
      components: previousAccount.components,
      updatedAt,
      consumableNoteIds,
    });
  });
  const filteredAccounts = accounts.filter((account) => account !== undefined);
  return [
    ...filteredAccounts,
    ...previousAccounts
      .filter(
        (account) => !filteredAccounts.map(({ id }) => id).includes(account.id),
      )
      .map((account) => {
        const consumableP2IDNoteIds = accountConsumableP2IDNoteIds(account.id);
        if (account.multisig) {
          const pendingConsumableNotesProposalsNoteIds =
            account.multisig.proposals.reduce<string[]>(
              (previousValue, currentValue) =>
                ["pending", "ready"].includes(currentValue.status) &&
                currentValue.metadata.proposalType === "consume_notes"
                  ? [...previousValue, ...currentValue.metadata.noteIds]
                  : previousValue,
              [],
            );
          return {
            ...account,
            consumableNoteIds: consumableP2IDNoteIds.filter(
              (id) => !pendingConsumableNotesProposalsNoteIds.includes(id),
            ),
          };
        }
        if (account.address === connectedWallet?.address) {
          // handle new public accounts updates
          const isNewPublicWallet =
            account.isPublic && midenWalletAssets.length === 0;
          if (isNewPublicWallet) {
            return {
              ...account,
              consumableNoteIds: consumableP2IDNoteIds,
            };
          }
          // handle private accounts updates
          if (account.isPrivate) {
            return {
              ...account,
              consumableNoteIds: consumableP2IDNoteIds,
              fungibleAssets: midenWalletAssets
                ? midenWalletAssets.map(({ faucetId, amount }) => ({
                    faucetId: WasmAddress.fromBech32(faucetId)
                      .accountId()
                      .toString(),
                    amount,
                  }))
                : account.fungibleAssets,
            };
          }
        }
        return { ...account, consumableNoteIds: consumableP2IDNoteIds };
      }),
  ];
};

const syncInputNotes = ({
  previousInputNotes,
  wasmInputNoteRecords,
  scripts,
  updatedAt,
  connectedWallet,
}: {
  previousInputNotes: InputNote[];
  wasmInputNoteRecords: WasmInputNoteRecord[];
  scripts: Script[];
  updatedAt: number | null;
  connectedWallet?: Account;
}) => {
  const inputNotes = wasmInputNoteRecords
    .map((wasmInputNoteRecord) =>
      wasmInputNoteToInputNote({
        record: wasmInputNoteRecord,
        previousInputNote: previousInputNotes.find(
          ({ id }) => id === wasmInputNoteRecord.id()?.toString(),
        ),
        scripts,
        updatedAt,
      }),
    )
    .filter(({ id }) => id !== "");
  const connectedWalletP2IDNotes = previousInputNotes.filter(
    ({ scriptRoot, storage }) => {
      const [suffix = "", prefix = ""] = storage;
      const targetAccountId = accountIdFromPrefixSuffix(prefix, suffix);
      return (
        scriptRoot === P2ID_NOTE_CODE && targetAccountId === connectedWallet?.id
      );
    },
  );
  return [
    ...inputNotes,
    ...connectedWalletP2IDNotes
      .filter(
        (inputNote) => !inputNotes.map(({ id }) => id).includes(inputNote.id),
      )
      .map((inputNote) => ({
        ...inputNote,
        state: connectedWallet?.isNew
          ? ("committed" as NoteState)
          : ("consumed-external" as NoteState),
      })),
  ];
};

const syncTransactions = ({
  previousTransactions,
  wasmTransactionRecords,
}: {
  previousTransactions: Transaction[];
  wasmTransactionRecords: WasmTransactionRecord[];
}) =>
  previousTransactions.map((previousTransaction) => {
    const record = wasmTransactionRecords.find(
      (wasmTransactionRecord) =>
        wasmTransactionRecord.id().toHex() === previousTransaction.id,
    );
    return {
      ...previousTransaction,
      status: record ? transactionStatus(record) : "",
    };
  });

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
    transactions: previousTransactions,
    scripts,
    nextState,
    tutorialId,
    completedTutorials,
    dispatch,
  } = useGlobalContext();
  const connectedWallet = previousAccounts.find(
    ({ address }) => address === midenWalletAddress,
  );
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
      const [
        wasmAccounts,
        wasmInputNoteRecords,
        wasmTransactionRecords,
        midenWalletAssets,
      ] = await Promise.all([
        clientGetAccounts({
          client,
          accountIds: previousAccounts
            .filter(
              ({ id, isNew, isPrivate }) =>
                id !== midenFaucetAccountId(networkId) && !isNew && !isPrivate,
            )
            .map(({ id }) => id),
        }),
        clientGetAllInputNotes({
          client,
          networkId,
        }),
        clientGetAllTransactions(client),
        wallet && requestAssets ? await requestAssets() : [],
      ]);
      /* const inputNotes = wasmInputNoteRecords.map((wasmInputNoteRecord) =>
        wasmInputNoteToInputNote({
          record: wasmInputNoteRecord,
          previousInputNote: previousInputNotes.find(
            ({ id }) => id === wasmInputNoteRecord.id().toString(),
          ),
          scripts,
          updatedAt: lastSyncTime,
        }),
      );
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
        const midenWalletAssets =
          previousAccount.address === midenWalletAddress &&
          wallet &&
          requestAssets
            ? await requestAssets()
            : [];
        const isNewPublicWallet =
          previousAccount.address === midenWalletAddress &&
          previousAccount.storageMode === "public" &&
          midenWalletAssets.length === 0;
        if (previousAccount.address === midenWalletAddress) {
          // always re-add notes targetting connected wallet
          inputNotes.push(
            ...previousAccountP2IDNotes
              .filter(({ id }) => !inputNotes.find((note) => note.id === id))
              .map((note) => ({
                ...note,
                state: isNewPublicWallet
                  ? ("committed" as NoteState)
                  : ("consumed-external" as NoteState),
              })),
          );
          // handle new public accounts updates
          if (isNewPublicWallet) {
            accounts.push({
              ...previousAccount,
              consumableNoteIds: previousAccountConsumableP2IDNotes.map(
                ({ id }) => id,
              ),
            });
            continue;
          }
          // handle private accounts updates
          if (previousAccount.storageMode === "private") {
            accounts.push({
              ...previousAccount,
              consumableNoteIds: previousAccountConsumableP2IDNotes.map(
                ({ id }) => id,
              ),
              fungibleAssets: midenWalletAssets
                ? midenWalletAssets.map(({ faucetId, amount }) => ({
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
          // TODO this is unreliable for some reason?
          // const consumableNotes = await clientGetConsumableNotes({
          //   client,
          //   accountId: previousAccount.id,
          // });
          // const consumableNoteIds = consumableNotes.map((consumableNote) =>
          //   consumableNote.inputNoteRecord().id().toString(),
          // );
          const consumableP2IDNoteIds = consumableP2IDNotes
            .filter(({ storage }) => {
              const [suffix = "", prefix = ""] = storage;
              const targetAccountId = accountIdFromPrefixSuffix(prefix, suffix);
              return targetAccountId === previousAccount.id;
            })
            .map(({ id }) => id);
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
          const consumableNoteIds = uniq([
            ...consumableP2IDNoteIds,
            ...consumableInputNoteIds,
          ]);
          //
          const isNewPublicAccount =
            previousAccount.address === midenWalletAddress
              ? isNewPublicWallet
              : previousAccount.isNew &&
                previousAccount.storageMode === "public";
          if (isNewPublicAccount || previousAccount.storageMode === "private") {
            const existingAccount = accounts.find(
              ({ id }) => id === previousAccount.id,
            );
            if (!existingAccount) {
              accounts.push({ ...previousAccount, consumableNoteIds });
            }
          } else {
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
          }
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
          const existingAccount = accounts.find(
            ({ id }) => id === previousAccount.id,
          );
          if (!existingAccount) {
            accounts.push(previousAccount);
          }
        }
      } */
      const syncedInputNotes = syncInputNotes({
        previousInputNotes,
        wasmInputNoteRecords,
        scripts,
        updatedAt: lastSyncTime,
        connectedWallet,
      });
      const syncedAccounts = syncAccounts({
        previousAccounts,
        wasmAccounts,
        updatedAt: lastSyncTime,
        inputNotes: syncedInputNotes,
        connectedWallet,
        midenWalletAssets,
      });
      // const accountsSorted = accounts
      //   .toSorted((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
      //   .map((account) => omit(account, "updatedAt"));
      // const accountsStringified = JSON.stringify(accountsSorted);
      // const syncedAccountsSorted = syncedAccounts
      //   .toSorted((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
      //   .map((account) => omit(account, "updatedAt"));
      // const syncedAccountsStringified = JSON.stringify(syncedAccountsSorted);
      // const diff = accountsStringified !== syncedAccountsStringified;
      // if (diff) {
      //   console.log("ACCOUNTS");
      //   console.log(accountsSorted);
      //   console.log("SYNCED ACCOUNTS");
      //   console.log(syncedAccountsSorted);
      // }
      dispatch({
        type: "SYNC_STATE",
        payload: {
          accounts: syncedAccounts,
          inputNotes: syncedInputNotes,
          transactions: syncTransactions({
            previousTransactions,
            wasmTransactionRecords,
          }),
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
