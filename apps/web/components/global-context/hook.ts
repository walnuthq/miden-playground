import { useContext } from "react";
import GlobalContext from "@/components/global-context";
// import { deleteStore } from "@/lib/utils";
import {
  type NetworkId,
  wasmInputNoteToInputNote,
  type Account,
  wasmAccountToAccount,
} from "@/lib/types";
import { webClient } from "@/lib/web-client";
import {
  NoteFilter,
  NoteFilterTypes,
  AccountId,
} from "@workspace/mock-web-client";

const emptyStore = {
  accountCode: [],
  accountStorage: [],
  accountVaults: [],
  accountAuth: [],
  accounts: [],
  transactions: [],
  transactionScripts: [],
  inputNotes: [],
  outputNotes: [],
  notesScripts: [],
  stateSync: [{ id: 1, blockNum: "0" }],
  blockHeaders: [],
  partialBlockchainNodes: [],
  tags: [],
  foreignAccountCode: [],
};

const useGlobalContext = () => {
  const { state, dispatch } = useContext(GlobalContext);
  const resetState = async () => {
    const client = await webClient(state.networkId);
    await client.forceImportStore(JSON.stringify(emptyStore));
    // await deleteStore();
    dispatch({ type: "RESET_STATE" });
  };
  const switchNetwork = (networkId: NetworkId) => {
    dispatch({ type: "SWITCH_NETWORK", payload: { networkId } });
  };
  const syncState = async () => {
    const client = await webClient(state.networkId);
    const syncSummary = await client.syncState();
    const { NoteFilter: WasmNoteFilter, AccountId: WasmAccountId } =
      await import("@demox-labs/miden-sdk");
    const inputNotes = await client.getInputNotes(
      new WasmNoteFilter(NoteFilterTypes.All)
    );
    const accounts: Account[] = [];
    for (const account of state.accounts) {
      const wasmAccount = await client.getAccount(
        WasmAccountId.fromHex(account.id)
      );
      const consumableNotes = await client.getConsumableNotes(
        WasmAccountId.fromHex(account.id)
      );
      const noteIds = consumableNotes.map((consumableNote) =>
        consumableNote.inputNoteRecord().id().toString()
      );
      //consumableNoteIds[account.id] = noteIds;
      if (wasmAccount) {
        wasmAccount.id = () => AccountId.fromHex(account.id);
        accounts.push(
          wasmAccountToAccount(
            wasmAccount,
            account.name,
            state.networkId,
            syncSummary.blockNum(),
            noteIds,
            account.tokenSymbol
          )
        );
      }
    }
    dispatch({
      type: "SYNC_STATE",
      payload: {
        syncSummary,
        //consumableNoteIds,
        accounts,
        inputNotes: inputNotes.map((inputNoteRecord) =>
          wasmInputNoteToInputNote(inputNoteRecord, state.networkId)
        ),
      },
    });
  };
  return { ...state, dispatch, resetState, switchNetwork, syncState };
};

export default useGlobalContext;
