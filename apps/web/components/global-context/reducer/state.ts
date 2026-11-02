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
  // Switches to the queued next state, or to `state` instead (its fallback).
  | { type: "POP_STATE"; payload?: { state: State } };

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
      const nextState = action.payload?.state ?? state.nextState;
      if (!nextState) {
        return state;
      }
      return {
        ...nextState,
        nextState: null,
        nextStore: null,
        fallbackState: null,
      };
    }
  }
};

export default reducer;
