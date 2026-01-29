import { type Account } from "@/lib/types/account";
import { type InputNote } from "@/lib/types/note";
import { type State } from "@/lib/types/state";

export type AccountAction =
  | {
      type: "NEW_ACCOUNT";
      payload: { account: Account };
    }
  | { type: "UPDATE_ACCOUNT"; payload: { account: Account } }
  | {
      type: "IMPORT_ACCOUNT";
      payload: {
        account: Account;
        inputNotes: InputNote[];
        blockNum: number;
      };
    }
  | {
      type: "OPEN_CREATE_WALLET_DIALOG";
    }
  | {
      type: "CLOSE_CREATE_WALLET_DIALOG";
    }
  | {
      type: "OPEN_CREATE_FAUCET_DIALOG";
    }
  | {
      type: "CLOSE_CREATE_FAUCET_DIALOG";
    }
  | {
      type: "OPEN_IMPORT_ACCOUNT_DIALOG";
    }
  | {
      type: "CLOSE_IMPORT_ACCOUNT_DIALOG";
    }
  | {
      type: "OPEN_DEPLOY_ACCOUNT_DIALOG";
    }
  | {
      type: "CLOSE_DEPLOY_ACCOUNT_DIALOG";
    }
  | {
      type: "OPEN_VERIFY_ACCOUNT_COMPONENT_DIALOG";
      payload: { accountId: string };
    }
  | {
      type: "CLOSE_VERIFY_ACCOUNT_COMPONENT_DIALOG";
    };

const reducer = (state: State, action: AccountAction): State => {
  switch (action.type) {
    case "NEW_ACCOUNT": {
      return {
        ...state,
        submittingTransaction: false,
        accounts: [...state.accounts, action.payload.account],
      };
    }
    case "UPDATE_ACCOUNT": {
      const index = state.accounts.findIndex(
        ({ id }) => id === action.payload.account.id,
      );
      return {
        ...state,
        accounts: [
          ...state.accounts.slice(0, index),
          { ...action.payload.account, updatedAt: Date.now() },
          ...state.accounts.slice(index + 1),
        ],
      };
    }
    case "IMPORT_ACCOUNT": {
      const account = state.accounts.find(
        ({ id }) => id === action.payload.account.id,
      );
      if (account) {
        return state;
      }
      const noteIds = state.inputNotes.map(({ id }) => id);
      const filteredInputNotes = action.payload.inputNotes.filter(
        ({ id }) => !noteIds.includes(id),
      );
      return {
        ...state,
        accounts: [...state.accounts, action.payload.account],
        inputNotes: [...state.inputNotes, ...filteredInputNotes],
        blockNum: action.payload.blockNum,
      };
    }
    case "OPEN_CREATE_WALLET_DIALOG": {
      return {
        ...state,
        createWalletDialogOpen: true,
      };
    }
    case "CLOSE_CREATE_WALLET_DIALOG": {
      return {
        ...state,
        createWalletDialogOpen: false,
      };
    }
    case "OPEN_CREATE_FAUCET_DIALOG": {
      return {
        ...state,
        createFaucetDialogOpen: true,
      };
    }
    case "CLOSE_CREATE_FAUCET_DIALOG": {
      return {
        ...state,
        createFaucetDialogOpen: false,
      };
    }
    case "OPEN_IMPORT_ACCOUNT_DIALOG": {
      return {
        ...state,
        importAccountDialogOpen: true,
      };
    }
    case "CLOSE_IMPORT_ACCOUNT_DIALOG": {
      return {
        ...state,
        importAccountDialogOpen: false,
      };
    }
    case "OPEN_DEPLOY_ACCOUNT_DIALOG": {
      return {
        ...state,
        deployAccountDialogOpen: true,
      };
    }
    case "CLOSE_DEPLOY_ACCOUNT_DIALOG": {
      return {
        ...state,
        deployAccountDialogOpen: false,
      };
    }
    case "OPEN_VERIFY_ACCOUNT_COMPONENT_DIALOG": {
      return {
        ...state,
        verifyAccountComponentDialogOpen: true,
        verifyAccountComponentDialogAccountId: action.payload.accountId,
      };
    }
    case "CLOSE_VERIFY_ACCOUNT_COMPONENT_DIALOG": {
      return {
        ...state,
        verifyAccountComponentDialogOpen: false,
        verifyAccountComponentDialogAccountId: "",
      };
    }
  }
};

export default reducer;
