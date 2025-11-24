import { useContext } from "react";
import GlobalContext from "@/components/global-context";
import {
  webClient,
  clientGetAllInputNotes,
  clientGetAccountByAddress,
  // clientGetConsumableNotes,
  wasmAccountToAccount,
} from "@/lib/web-client";
import { accountIdFromPrefixSuffix, type Account } from "@/lib/types/account";
import { type NetworkId } from "@/lib/types/network";
import { defaultStore, deleteStore } from "@/lib/types/store";
import { noteConsumed } from "@/lib/types/note";
// import { P2ID_NOTE_CODE } from "@/lib/constants";

const useGlobalContext = () => {
  const { state, dispatch } = useContext(GlobalContext);
  const resetState = async (networkId: NetworkId) => {
    if (state.networkId !== "mlcl") {
      const previousWebClient = await webClient(
        state.networkId,
        state.serializedMockChain
      );
      await previousWebClient.syncState();
    }
    //
    await deleteStore();
    const client = await webClient(networkId, null);
    await client.forceImportStore(JSON.stringify(defaultStore()));
    const syncSummary = await client.syncState();
    console.log("blockNum", syncSummary.blockNum());
    dispatch({
      type: "RESET_STATE",
      payload: { networkId, blockNum: syncSummary.blockNum() },
    });
  };
  const syncState = async () => {
    try {
      const client = await webClient(
        state.networkId,
        state.serializedMockChain
      );
      const syncSummary = await client.syncState();
      const inputNotes = await clientGetAllInputNotes(client, state.inputNotes);
      const accounts: Account[] = [];
      for (const account of state.accounts) {
        const wasmAccount = await clientGetAccountByAddress(
          client,
          account.address
        );
        // console.log(wasmAccount.id().toString());
        // console.log(wasmAccount.serialize());
        // const consumableNotes = await clientGetConsumableNotes(
        //   client,
        //   account.id
        // );
        // const noteIds = consumableNotes.map((consumableNote) =>
        //   consumableNote.inputNoteRecord().id().toString()
        // );
        // TODO fix for getConsumableNotes
        const noteIds: string[] = [];
        for (const inputNote of inputNotes) {
          if (
            // inputNote.scriptRoot !== P2ID_NOTE_CODE ||
            noteConsumed(inputNote)
          ) {
            continue;
          }
          const targetAccountId = accountIdFromPrefixSuffix(
            inputNote.inputs[1]!,
            inputNote.inputs[0]!
          );
          if (
            account.id === targetAccountId &&
            !noteIds.includes(inputNote.id)
          ) {
            noteIds.push(inputNote.id);
          }
        }
        const updatedAccount = await wasmAccountToAccount({
          wasmAccount,
          name: account.name,
          components: account.components,
          networkId: state.networkId,
          updatedAt: syncSummary.blockNum(),
          consumableNoteIds: noteIds,
          scripts: state.scripts,
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
    } catch (error) {
      console.error(error);
    }
  };
  return {
    ...state,
    dispatch,
    resetState,
    syncState,
  };
};

export default useGlobalContext;
