import { useContext } from "react";
import GlobalContext from "@/components/global-context";
// import { deleteStore } from "@/lib/utils";
import {
  webClient,
  clientGetAllInputNotes,
  clientGetAccountByAddress,
  clientGetConsumableNotes,
  wasmAccountToAccount,
  wasmInputNoteToInputNote,
} from "@/lib/web-client";
import { type NetworkId, type Account } from "@/lib/types";
import { defaultStore } from "@/lib/store";

const useGlobalContext = () => {
  const { state, dispatch } = useContext(GlobalContext);
  const resetState = async () => {
    const client = await webClient(state.networkId, null);
    await client.forceImportStore(JSON.stringify(defaultStore()));
    // await deleteStore();
    const syncSummary = await client.syncState();
    console.log("blockNum", syncSummary.blockNum());
    dispatch({
      type: "RESET_STATE",
      payload: { blockNum: syncSummary.blockNum() },
    });
  };
  const switchNetwork = async (networkId: NetworkId) => {
    const client = await webClient(networkId, state.serializedMockChain);
    const syncSummary = await client.syncState();
    dispatch({
      type: "SWITCH_NETWORK",
      payload: { networkId, blockNum: syncSummary.blockNum() },
    });
  };
  const syncState = async () => {
    const client = await webClient(state.networkId, state.serializedMockChain);
    const syncSummary = await client.syncState();
    const wasmInputNotes = await clientGetAllInputNotes(client);
    const accounts: Account[] = [];
    for (const account of state.accounts) {
      const wasmAccount = await clientGetAccountByAddress(
        client,
        account.address
      );
      const consumableNotes = await clientGetConsumableNotes(
        client,
        account.id
      );
      console.log(consumableNotes.length);
      const noteIds = consumableNotes.map((consumableNote) =>
        consumableNote.inputNoteRecord().id().toString()
      );
      const updatedAccount = await wasmAccountToAccount(
        wasmAccount,
        account.name,
        state.networkId,
        syncSummary.blockNum(),
        noteIds,
        account.tokenSymbol
      );
      accounts.push(updatedAccount);
    }
    const inputNotes = await Promise.all(
      wasmInputNotes.map((wasmInputNote) =>
        wasmInputNoteToInputNote(wasmInputNote)
      )
    );
    dispatch({
      type: "SYNC_STATE",
      payload: {
        blockNum: syncSummary.blockNum(),
        //consumableNoteIds,
        accounts,
        inputNotes,
      },
    });
  };
  return { ...state, dispatch, resetState, switchNetwork, syncState };
};

export default useGlobalContext;
