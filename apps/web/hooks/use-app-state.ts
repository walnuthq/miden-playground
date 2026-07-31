"use client";
import { uniq } from "lodash";
import {
  Address as WasmAddress,
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
import { P2ID_NOTE_CODE, midenFaucetAccountId } from "@/lib/constants";
import { useWallet, type Asset } from "@miden-sdk/miden-wallet-adapter";
import { storeName, defaultStore } from "@/lib/utils/store";
import type { InputNote, NoteState } from "@/lib/types/note";
import type { Transaction } from "@/lib/types/transaction";
import type { Script } from "@/lib/types/script";
// import { toBase64 } from "@/lib/utils";
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
  // const wasmAccount = wasmAccounts.find(
  //   (wasmAccount) =>
  //     wasmAccount.id().toString() === "0xe4062b9a7484b0116bd1931d4cba9f",
  // );
  // if (wasmAccount) {
  //   console.log(wasmAccount.code().commitment().toHex());
  //   console.log(toBase64(wasmAccount.serialize()));
  // }
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
  // const wasmInputNoteRecord = wasmInputNoteRecords.find(
  //   (wasmInputNoteRecord) =>
  //     wasmInputNoteRecord.id()?.toString() ===
  //     "0x802e4037a3f235a10a1b1a6a56c8097424c9e64ae8f27da80089f1d2db2bf081",
  // );
  // if (wasmInputNoteRecord) {
  //   console.log(wasmInputNoteRecord.toNote().script().root().toHex());
  //   console.log(toBase64(wasmInputNoteRecord.toNote().serialize()));
  // }
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
  const connectedWalletP2IDNotes = connectedWallet?.isPublic
    ? previousInputNotes.filter(({ scriptRoot, storage }) => {
        const [suffix = "", prefix = ""] = storage;
        const targetAccountId = accountIdFromPrefixSuffix(prefix, suffix);
        return (
          scriptRoot === P2ID_NOTE_CODE &&
          targetAccountId === connectedWallet?.id
        );
      })
    : [];
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
              ({ id, isPublic }) =>
                id !== midenFaucetAccountId(networkId) && isPublic,
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
