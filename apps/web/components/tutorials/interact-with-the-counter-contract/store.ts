import { type Store } from "@/lib/types";

const store: Store = {
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

export default store;
