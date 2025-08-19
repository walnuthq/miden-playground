import { useContext } from "react";
import GlobalContext from "@/components/global-context";
// import { deleteStore } from "@/lib/utils";
import { mockWebClient } from "@/lib/mock-web-client";
// import { webClient } from "@/lib/web-client";

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
    const client = await mockWebClient();
    // localStorage.removeItem("serializedMockChain");
    // const client = await webClient();
    await client.forceImportStore(JSON.stringify(emptyStore));
    // await deleteStore();
    dispatch({ type: "RESET_STATE" });
  };
  return { ...state, dispatch, resetState };
};

export default useGlobalContext;
