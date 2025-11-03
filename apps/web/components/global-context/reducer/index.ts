import { type State } from "@/lib/types/state";
import globalReducer, {
  type GlobalAction,
} from "@/components/global-context/reducer/global";
import accountReducer, {
  type AccountAction,
} from "@/components/global-context/reducer/account";
import transactionReducer, {
  type TransactionAction,
} from "@/components/global-context/reducer/transaction";
import noteReducer, {
  type NoteAction,
} from "@/components/global-context/reducer/note";
import scriptReducer, {
  type ScriptAction,
} from "@/components/global-context/reducer/script";
import componentReducer, {
  type ComponentAction,
} from "@/components/global-context/reducer/component";
import tutorialReducer, {
  type TutorialAction,
} from "@/components/global-context/reducer/tutorial";

export type Action =
  | GlobalAction
  | AccountAction
  | TransactionAction
  | NoteAction
  | ScriptAction
  | ComponentAction
  | TutorialAction;

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "RESET_STATE":
    case "SWITCH_NETWORK":
    case "SYNC_STATE":
    case "LOAD_STATE": {
      return globalReducer(state, action);
    }
    case "NEW_ACCOUNT":
    case "IMPORT_ACCOUNT":
    case "OPEN_CREATE_WALLET_DIALOG":
    case "CLOSE_CREATE_WALLET_DIALOG":
    case "OPEN_CREATE_FAUCET_DIALOG":
    case "CLOSE_CREATE_FAUCET_DIALOG":
    case "OPEN_IMPORT_ACCOUNT_DIALOG":
    case "CLOSE_IMPORT_ACCOUNT_DIALOG":
    case "OPEN_DEPLOY_ACCOUNT_DIALOG":
    case "CLOSE_DEPLOY_ACCOUNT_DIALOG":
    case "OPEN_VERIFY_ACCOUNT_COMPONENT_DIALOG":
    case "CLOSE_VERIFY_ACCOUNT_COMPONENT_DIALOG":
    case "VERIFY_ACCOUNT_COMPONENT": {
      return accountReducer(state, action);
    }
    case "OPEN_CREATE_TRANSACTION_DIALOG":
    case "CLOSE_CREATE_TRANSACTION_DIALOG":
    case "SUBMIT_TRANSACTION": {
      return transactionReducer(state, action);
    }
    case "OPEN_EXPORT_NOTE_DIALOG":
    case "CLOSE_EXPORT_NOTE_DIALOG":
    case "OPEN_IMPORT_NOTE_DIALOG":
    case "CLOSE_IMPORT_NOTE_DIALOG":
    case "OPEN_CREATE_NOTE_DIALOG":
    case "CLOSE_CREATE_NOTE_DIALOG":
    case "OPEN_VERIFY_NOTE_SCRIPT_DIALOG":
    case "CLOSE_VERIFY_NOTE_SCRIPT_DIALOG":
    case "VERIFY_NOTE_SCRIPT": {
      return noteReducer(state, action);
    }
    case "OPEN_CREATE_SCRIPT_DIALOG":
    case "CLOSE_CREATE_SCRIPT_DIALOG":
    case "OPEN_DELETE_SCRIPT_ALERT_DIALOG":
    case "CLOSE_DELETE_SCRIPT_ALERT_DIALOG":
    case "NEW_SCRIPT":
    case "UPDATE_SCRIPT":
    case "DELETE_SCRIPT":
    case "OPEN_INVOKE_PROCEDURE_ARGUMENTS_DIALOG":
    case "CLOSE_INVOKE_PROCEDURE_ARGUMENTS_DIALOG": {
      return scriptReducer(state, action);
    }
    case "OPEN_CREATE_COMPONENT_DIALOG":
    case "CLOSE_CREATE_COMPONENT_DIALOG":
    case "OPEN_UPSERT_STORAGE_SLOT_DIALOG":
    case "CLOSE_UPSERT_STORAGE_SLOT_DIALOG":
    case "NEW_COMPONENT":
    case "UPDATE_COMPONENT": {
      return componentReducer(state, action);
    }
    case "LOAD_TUTORIAL":
    case "PREVIOUS_TUTORIAL_STEP":
    case "NEXT_TUTORIAL_STEP":
    case "SET_TUTORIAL_STEP":
    case "OPEN_TUTORIAL":
    case "CLOSE_TUTORIAL":
    case "SET_NEXT_TUTORIAL_STEP_DISABLED": {
      return tutorialReducer(state, action);
    }
  }
};

export default reducer;
