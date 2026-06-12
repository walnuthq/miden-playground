"use client";
import { uniq } from "lodash";
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
import { P2ID_NOTE_CODE /*, midenFaucetAddress*/ } from "@/lib/constants";
import { useWallet } from "@miden-sdk/miden-wallet-adapter";
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
}: {
  previousAccounts: Account[];
  wasmAccounts: WasmAccount[];
  updatedAt: number | null;
  inputNotes: InputNote[];
}) => {
  const consumableP2IDNotes = inputNotes.filter(
    (inputNote) =>
      !noteConsumed(inputNote) && inputNote.scriptRoot === P2ID_NOTE_CODE,
  );
  const accounts = wasmAccounts.map((wasmAccount) => {
    const previousAccount = previousAccounts.find(
      ({ id }) => id === wasmAccount.id().toString(),
    );
    if (!previousAccount) {
      return;
    }
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
    ...previousAccounts.filter(
      (account) => !filteredAccounts.map(({ id }) => id).includes(account.id),
    ),
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
  const inputNotes = wasmInputNoteRecords.map((wasmInputNoteRecord) =>
    wasmInputNoteToInputNote({
      record: wasmInputNoteRecord,
      previousInputNote: previousInputNotes.find(
        ({ id }) => id === wasmInputNoteRecord.id().toString(),
      ),
      scripts,
      updatedAt,
    }),
  );
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
  const { /*wallet,*/ address: midenWalletAddress /*, requestAssets*/ } =
    useWallet();
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
      const [wasmAccounts, wasmInputNoteRecords, wasmTransactionRecords] =
        await Promise.all([
          clientGetAccounts({
            client,
            accountIds: previousAccounts.map(({ id }) => id),
          }),
          clientGetAllInputNotes({
            client,
            networkId,
          }),
          clientGetAllTransactions(client),
        ]);
      const inputNotes = syncInputNotes({
        previousInputNotes,
        wasmInputNoteRecords,
        scripts,
        updatedAt: lastSyncTime,
        connectedWallet,
      });
      dispatch({
        type: "SYNC_STATE",
        payload: {
          accounts: syncAccounts({
            previousAccounts,
            wasmAccounts,
            updatedAt: lastSyncTime,
            inputNotes,
          }),
          inputNotes,
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
