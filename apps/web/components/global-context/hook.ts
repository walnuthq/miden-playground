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
import { type Account } from "@/lib/types/account";
import { type NetworkId } from "@/lib/types/network";
import { defaultStore } from "@/lib/types/store";
import { noteInputsToAccountId } from "@/lib/utils";
import { noteConsumed } from "@/lib/types/note";

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
    const inputNotes = await Promise.all(
      wasmInputNotes.map((wasmInputNote) =>
        wasmInputNoteToInputNote(wasmInputNote)
      )
    );
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
      const noteIds = consumableNotes.map((consumableNote) =>
        consumableNote.inputNoteRecord().id().toString()
      );
      // FIXME fix for getConsumableNotes
      for (const inputNote of inputNotes) {
        if (
          inputNote.scriptRoot !=
            "0x21cd4efe03f8d0db7354bee1a89e41e28fa23a1c5da0918c8afbfef710a91cc3" ||
          noteConsumed(inputNote)
        ) {
          continue;
        }
        const targetAccountId = noteInputsToAccountId(inputNote.inputs);
        if (account.id === targetAccountId && !noteIds.includes(inputNote.id)) {
          noteIds.push(inputNote.id);
        }
      }
      //
      const updatedAccount = await wasmAccountToAccount({
        wasmAccount,
        name: account.name,
        isWallet: account.isWallet,
        tokenSymbol: account.tokenSymbol,
        components: account.components,
        networkId: state.networkId,
        updatedAt: syncSummary.blockNum(),
        consumableNoteIds: noteIds,
      });
      accounts.push(updatedAccount);
    }
    //
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
