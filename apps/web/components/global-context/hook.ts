import { useContext } from "react";
import GlobalContext from "@/components/global-context";
// import { deleteStore } from "@/lib/utils";
import { webClient } from "@/lib/web-client";
import {
  type NetworkId,
  wasmInputNoteToInputNote,
  type Account,
  wasmAccountToAccount,
} from "@/lib/types";
import { NoteFilterTypes, AccountId } from "@workspace/mock-web-client";

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
    // localStorage.removeItem("serializedMockChain");
    // const client = await webClient();
    await client.forceImportStore(JSON.stringify(emptyStore));
    // await deleteStore();
    const syncSummary = await client.syncState();
    console.log("blockNum", syncSummary.blockNum());
    dispatch({
      type: "RESET_STATE",
      payload: { blockNum: syncSummary.blockNum() },
    });
  };
  const switchNetwork = async (networkId: NetworkId) => {
    const client = await webClient(networkId);
    const syncSummary = await client.syncState();
    dispatch({
      type: "SWITCH_NETWORK",
      payload: { networkId, blockNum: syncSummary.blockNum() },
    });
  };
  const syncState = async () => {
    const client = await webClient(state.networkId);
    const syncSummary = await client.syncState();
    const { NoteFilter: WasmNoteFilter, AccountId: WasmAccountId } =
      await import("@demox-labs/miden-sdk");
    const inputNotes = await client.getInputNotes(
      new WasmNoteFilter(NoteFilterTypes.All),
    );
    const accounts: Account[] = [];
    for (const account of state.accounts) {
      const wasmAccount = await client.getAccount(
        // @ts-ignore
        WasmAccountId.fromHex(account.id),
      );
      const consumableNotes = await client.getConsumableNotes(
        // @ts-ignore
        WasmAccountId.fromHex(account.id),
      );
      const noteIds = consumableNotes.map((consumableNote) =>
        consumableNote.inputNoteRecord().id().toString(),
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
            account.tokenSymbol,
          ),
        );
      }
    }
    dispatch({
      type: "SYNC_STATE",
      payload: {
        blockNum: syncSummary.blockNum(),
        //consumableNoteIds,
        accounts,
        inputNotes: inputNotes.map((inputNoteRecord) =>
          wasmInputNoteToInputNote(inputNoteRecord, state.networkId),
        ),
      },
    });
  };
  return { ...state, dispatch, resetState, switchNetwork, syncState };
};

export default useGlobalContext;
