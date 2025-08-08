import { useContext } from "react";
import GlobalContext from "@/components/global-context";
// import { deleteStore } from "@/lib/utils";
import { mockWebClient } from "@/lib/mock-web-client";

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
  stateSync: [],
  blockHeaders: [],
  partialBlockchainNodes: [],
  tags: [],
  foreignAccountCode: [],
};

const useGlobalContext = () => {
  const { state, dispatch } = useContext(GlobalContext);
  const resetState = async () => {
    const client = await mockWebClient();
    await client.forceImportStore(JSON.stringify(emptyStore));
    // await deleteStore();
    dispatch({ type: "RESET_STATE" });
  };
  return { ...state, dispatch, resetState };
};

export default useGlobalContext;
