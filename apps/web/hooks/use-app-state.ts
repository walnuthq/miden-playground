import {
  type Account as WasmAccount,
  Address as WasmAddress,
  type InputNoteRecord as WasmInputNoteRecord,
  type TransactionRecord as WasmTransactionRecord,
} from "@miden-sdk/miden-sdk";
import { type Asset, useWallet } from "@miden-sdk/miden-wallet-adapter";
import {
  clearMidenStorage,
  useImportStore,
  useMiden,
  useSyncState,
} from "@miden-sdk/react";
import { toast } from "sonner";
import useGlobalContext from "@/components/global-context/hook";
import { useParaWallet } from "@/components/providers/para-wallet-context";
import useNetwork from "@/hooks/use-network";
import useProjects from "@/hooks/use-projects";
import { midenFaucetAccountId, P2ID_NOTE_CODE } from "@/lib/constants";
import type { Account } from "@/lib/types/account";
import type { NetworkId } from "@/lib/types/network";
import type { InputNote } from "@/lib/types/note";
import type { Script } from "@/lib/types/script";
import type { State, WorkspaceStarter } from "@/lib/types/state";
import type { Store } from "@/lib/types/store";
import type { Transaction } from "@/lib/types/transaction";
import {
  accountIdFromPrefixSuffix,
  midenFaucetAccount,
} from "@/lib/utils/account";
import { mainnetSandboxStarter } from "@/lib/utils/mainnet-sandbox";
import { noteConsumed } from "@/lib/utils/note";
import { defaultState } from "@/lib/utils/state";
import { defaultStore, storeName } from "@/lib/utils/store";
import {
  clientGetAccounts,
  clientGetAllInputNotes,
  clientGetAllTransactions,
  transactionStatus,
  wasmAccountToAccount,
  wasmInputNoteRecordToInputNote,
} from "@/lib/web-client";

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
  //     wasmAccount.id().toString() === "0x8310ebba55c19a91697ab988d165fa",
  // );
  // if (wasmAccount) {
  //   // console.log(wasmAccount.code().commitment().toHex());
  //   // console.log(toBase64(wasmAccount.serialize()));
  //   console.log("prefix", wasmAccount.id().prefix().asInt());
  //   console.log("suffix", wasmAccount.id().suffix().asInt());
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
  const accounts = wasmAccounts.flatMap((wasmAccount) => {
    const previousAccount = previousAccounts.find(
      ({ id }) => id === wasmAccount.id().toString(),
    );
    if (!previousAccount) {
      return [];
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
    const consumableNoteIds = [
      ...new Set([...consumableP2IDNoteIds, ...consumableInputNoteIds]),
    ];
    return [
      wasmAccountToAccount({
        wasmAccount,
        name: previousAccount.name,
        components: previousAccount.components,
        multisig: previousAccount.multisig,
        updatedAt,
        consumableNoteIds,
      }),
    ];
  });
  return [
    ...accounts,
    ...previousAccounts
      .filter((account) => !accounts.map(({ id }) => id).includes(account.id))
      .map((account) => {
        const consumableP2IDNoteIds = accountConsumableP2IDNoteIds(account.id);
        if (account.multisig) {
          const pendingConsumableNotesProposalsNoteIds =
            account.multisig.proposals.flatMap(({ status, metadata }) =>
              ["pending", "ready"].includes(status) &&
              metadata.proposalType === "consume_notes"
                ? metadata.noteIds
                : [],
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
  // connectedWallet,
}: {
  previousInputNotes: InputNote[];
  wasmInputNoteRecords: WasmInputNoteRecord[];
  scripts: Script[];
  updatedAt: number | null;
  // connectedWallet?: Account;
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
      wasmInputNoteRecordToInputNote({
        record: wasmInputNoteRecord,
        previousInputNote: previousInputNotes.find(
          ({ id }) => id === wasmInputNoteRecord.id()?.toString(),
        ),
        scripts,
        updatedAt,
      }),
    )
    .filter(({ id }) => id !== "");
  // const connectedWalletP2IDNotes =
  //   connectedWallet?.name === "Bread Wallet"
  //     ? previousInputNotes.filter(({ scriptRoot, storage }) => {
  //         const [suffix = "", prefix = ""] = storage;
  //         const targetAccountId = accountIdFromPrefixSuffix(prefix, suffix);
  //         return (
  //           scriptRoot === P2ID_NOTE_CODE &&
  //           targetAccountId === connectedWallet?.id
  //         );
  //       })
  //     : [];
  return [
    ...inputNotes,
    // ...connectedWalletP2IDNotes
    //   .filter(
    //     (inputNote) => !inputNotes.map(({ id }) => id).includes(inputNote.id),
    //   )
    //   .map((inputNote) => ({
    //     ...inputNote,
    //     state: connectedWallet?.isNew
    //       ? ("committed" as NoteState)
    //       : ("consumed-external" as NoteState),
    //   })),
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
  const paraWallet = useParaWallet();
  const { client, sync } = useMiden();
  const { importStore } = useImportStore();
  const { lastSyncTime } = useSyncState();
  // const { client: paraMidenClient } = useParaMiden();
  // const client = paraMidenClient ?? defaultClient;
  const {
    connected: midenWalletConnected,
    address: midenWalletAddress,
    requestAssets,
  } = useWallet();
  const {
    accounts: previousAccounts,
    inputNotes: previousInputNotes,
    transactions: previousTransactions,
    scripts,
    nextState,
    tutorialId,
    tutorialStep,
    tutorialMaxStep,
    completedTutorials,
    tutorialProgress,
    dispatch,
  } = useGlobalContext();
  const { saveProject } = useProjects();
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
        // MidenFiSignerProvider selects its only wallet up front, so `wallet`
        // is set before connecting; requestAssets throws until connected.
        midenWalletConnected && requestAssets ? await requestAssets() : [],
      ]);
      const syncedInputNotes = syncInputNotes({
        previousInputNotes,
        wasmInputNoteRecords,
        scripts,
        updatedAt: lastSyncTime,
        // connectedWallet,
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
          previousAccounts,
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
  // Saves the active tutorial, if any, so it can be resumed, and returns the
  // tutorial progress to carry into the next state. Call it before leaving the
  // tutorial, and before switching networks: it exports the current store.
  const leaveTutorial = async () => {
    // Already left by the switch underway, whose store is being replaced: its
    // progress is in the queued state.
    if (nextState) {
      return { ...tutorialProgress, ...nextState.tutorialProgress };
    }
    if (tutorialId === "") {
      return tutorialProgress;
    }
    try {
      await saveProject({ kind: "tutorial", id: tutorialId, name: tutorialId });
      return {
        ...tutorialProgress,
        [tutorialId]: {
          step: tutorialStep,
          maxStep: tutorialMaxStep,
          savedAt: Date.now(),
        },
      };
    } catch (error) {
      console.error("ERROR: leaveTutorial", error);
      return tutorialProgress;
    }
  };
  // Queues the next state, imported by `popState`. The active tutorial of the
  // next state has no progress entry: its progress is the state itself.
  const pushState = (nextState: State) => {
    const withProgress = (state: State) => ({
      ...state,
      tutorialProgress: Object.fromEntries(
        Object.entries(state.tutorialProgress).filter(
          ([id]) => id !== state.tutorialId,
        ),
      ),
    });
    dispatch({
      type: "PUSH_STATE",
      payload: {
        nextState: {
          ...withProgress(nextState),
          fallbackState: nextState.fallbackState
            ? withProgress(nextState.fallbackState)
            : null,
        },
      },
    });
  };
  const storeDump = (store: Store | string | null) =>
    typeof store === "string"
      ? store
      : JSON.stringify(store ?? defaultStore(networkId));
  const popState = async () => {
    if (!nextState) {
      return;
    }
    const { nextStore, fallbackState } = nextState;
    try {
      await clearMidenStorage();
      // Synced below, so a sync failure isn't taken for a failed import.
      await importStore(storeDump(nextStore), storeName(networkId), {
        skipSync: true,
      });
      dispatch({ type: "POP_STATE", payload: { imported: nextState } });
    } catch (error) {
      // The store couldn't be cleared, or the running client refuses the saved
      // project (e.g. written by a newer one): start over from the fallback
      // instead. Without a fallback it's a new sandbox.
      console.error("ERROR: importStore", error);
      const state = fallbackState ?? freshSandboxState(networkId);
      let fallbackImported = true;
      try {
        await importStore(storeDump(state.nextStore), storeName(networkId), {
          skipSync: true,
        });
      } catch (fallbackError) {
        console.error("ERROR: importStore", fallbackError);
        fallbackImported = false;
      }
      dispatch({
        type: "POP_STATE",
        payload: { imported: nextState, state },
      });
      if (!fallbackImported) {
        toast.error("The workspace couldn't be opened.", {
          description: "Reload the page to start a new sandbox.",
        });
      } else if (!fallbackState) {
        toast.error("The workspace couldn't be opened.", {
          description: "A new sandbox was started instead.",
        });
      } else if (fallbackState.tutorialId) {
        toast.warning("Your saved progress couldn't be restored.", {
          description: "The tutorial starts over.",
        });
      } else {
        toast.warning("The project couldn't be restored.", {
          description: "A new sandbox was started instead.",
        });
      }
    }
    // The Para client shares this store, whose contents (the Para account
    // included) were just replaced, and lost its connection to it.
    paraWallet?.resetClient();
    sync().catch((error) => console.error("ERROR: sync", error));
  };
  // A Mainnet sandbox doesn't start empty (see mainnetSandboxStarter); without
  // the API, it does, with a warning.
  const sandboxStarter = async (newNetworkId: NetworkId) => {
    if (newNetworkId !== "mm") {
      return { scripts: [], components: [] };
    }
    try {
      return await mainnetSandboxStarter();
    } catch (error) {
      toast.warning("The counter scripts couldn't be added.", {
        description: error instanceof Error ? error.message : String(error),
      });
      return { scripts: [], components: [] };
    }
  };
  // A fresh sandbox on the network: the default state with the network's
  // faucet and `starter`'s scripts and components (a Mainnet sandbox's, see
  // sandboxStarter), carrying what outlives a workspace: the completed
  // tutorials and the progress of those left unfinished.
  const freshSandboxState = (
    newNetworkId: NetworkId,
    {
      starter = { scripts: [], components: [] },
      tutorialProgress: nextTutorialProgress = tutorialProgress,
    }: {
      starter?: WorkspaceStarter;
      tutorialProgress?: State["tutorialProgress"];
    } = {},
  ): State => {
    const initialState = defaultState();
    return {
      ...initialState,
      accounts: [midenFaucetAccount(newNetworkId)],
      scripts: [...initialState.scripts, ...starter.scripts],
      components: [...initialState.components, ...starter.components],
      completedTutorials,
      tutorialProgress: nextTutorialProgress,
    };
  };
  const resetState = async (newNetworkId: NetworkId) => {
    const starter = await sandboxStarter(newNetworkId);
    const nextTutorialProgress = await leaveTutorial();
    switchNetwork(newNetworkId);
    pushState(
      freshSandboxState(newNetworkId, {
        starter,
        tutorialProgress: nextTutorialProgress,
      }),
    );
  };
  return {
    syncState,
    leaveTutorial,
    pushState,
    popState,
    freshSandboxState,
    resetState,
  };
};

export default useAppState;
