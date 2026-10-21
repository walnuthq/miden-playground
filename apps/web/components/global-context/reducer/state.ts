import type { Account } from "@/lib/types/account";
import type { InputNote } from "@/lib/types/note";
import type { State } from "@/lib/types/state";
import type { Transaction } from "@/lib/types/transaction";

export type StateAction =
  | { type: "SYNCING_STATE"; payload: { syncingState: boolean } }
  | {
      type: "SYNC_STATE";
      payload: {
        accounts: Account[];
        inputNotes: InputNote[];
        transactions: Transaction[];
      };
    }
  | {
      type: "PUSH_STATE";
      payload: { nextState: State };
    }
  | { type: "POP_STATE" };

const reducer = (state: State, action: StateAction): State => {
  switch (action.type) {
    case "SYNCING_STATE": {
      return {
        ...state,
        syncingState: action.payload.syncingState,
      };
    }
    case "SYNC_STATE": {
      // The payload is built from the accounts and transactions as they were
      // when the sync started: keep the ones added while it was running.
      const { accounts, inputNotes, transactions } = action.payload;
      return {
        ...state,
        accounts: [
          ...accounts,
          ...state.accounts.filter(
            ({ id }) => !accounts.some((account) => account.id === id),
          ),
        ],
        inputNotes,
        transactions: [
          ...transactions,
          ...state.transactions.filter(
            ({ id }) =>
              !transactions.some((transaction) => transaction.id === id),
          ),
        ],
        syncingState: false,
      };
    }
    case "PUSH_STATE": {
      return {
        ...state,
        nextState: action.payload.nextState,
      };
    }
    case "POP_STATE": {
      if (!state.nextState) {
        return state;
      }
      return {
        ...state.nextState,
        nextState: null,
      };
    }
  }
};

export default reducer;
