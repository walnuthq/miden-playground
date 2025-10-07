import { type Script, type Procedure } from "@/lib/types/script";
import { type State } from "@/lib/types/state";

export type ScriptAction =
  | {
      type: "OPEN_CREATE_SCRIPT_DIALOG";
    }
  | {
      type: "CLOSE_CREATE_SCRIPT_DIALOG";
    }
  | {
      type: "OPEN_DELETE_SCRIPT_ALERT_DIALOG";
      payload: { scriptId: string };
    }
  | {
      type: "CLOSE_DELETE_SCRIPT_ALERT_DIALOG";
    }
  | {
      type: "NEW_SCRIPT";
      payload: { script: Script };
    }
  | {
      type: "UPDATE_SCRIPT";
      payload: { script: Script };
    }
  | {
      type: "DELETE_SCRIPT";
      payload: { scriptId: string };
    }
  | {
      type: "OPEN_INVOKE_PROCEDURE_ARGUMENTS_DIALOG";
      payload: {
        senderAccountId: string;
        scriptId: string;
        procedure: Procedure;
      };
    }
  | { type: "CLOSE_INVOKE_PROCEDURE_ARGUMENTS_DIALOG" };

const reducer = (state: State, action: ScriptAction): State => {
  switch (action.type) {
    case "OPEN_CREATE_SCRIPT_DIALOG": {
      return {
        ...state,
        createScriptDialogOpen: true,
      };
    }
    case "CLOSE_CREATE_SCRIPT_DIALOG": {
      return {
        ...state,
        createScriptDialogOpen: false,
      };
    }
    case "OPEN_DELETE_SCRIPT_ALERT_DIALOG": {
      return {
        ...state,
        deleteScriptAlertDialogOpen: true,
        deleteScriptAlertDialogScriptId: action.payload.scriptId,
      };
    }
    case "CLOSE_DELETE_SCRIPT_ALERT_DIALOG": {
      return {
        ...state,
        deleteScriptAlertDialogOpen: false,
      };
    }
    case "NEW_SCRIPT": {
      return {
        ...state,
        scripts: [...state.scripts, action.payload.script],
      };
    }
    case "UPDATE_SCRIPT": {
      const index = state.scripts.findIndex(
        ({ id }) => id === action.payload.script.id
      );
      return {
        ...state,
        scripts: [
          ...state.scripts.slice(0, index),
          { ...action.payload.script, updatedAt: Date.now() },
          ...state.scripts.slice(index + 1),
        ],
      };
    }
    case "DELETE_SCRIPT": {
      const index = state.scripts.findIndex(
        ({ id }) => id === action.payload.scriptId
      );
      return {
        ...state,
        scripts: [
          ...state.scripts.slice(0, index),
          ...state.scripts.slice(index + 1),
        ],
      };
    }
    case "OPEN_INVOKE_PROCEDURE_ARGUMENTS_DIALOG": {
      return {
        ...state,
        invokeProcedureArgumentsDialogOpen: true,
        invokeProcedureArgumentsDialogSenderAccountId:
          action.payload.senderAccountId,
        invokeProcedureArgumentsDialogScriptId: action.payload.scriptId,
        invokeProcedureArgumentsDialogProcedure: action.payload.procedure,
      };
    }
    case "CLOSE_INVOKE_PROCEDURE_ARGUMENTS_DIALOG": {
      return {
        ...state,
        invokeProcedureArgumentsDialogOpen: false,
        invokeProcedureArgumentsDialogSenderAccountId: "",
        invokeProcedureArgumentsDialogScriptId: "",
        invokeProcedureArgumentsDialogProcedure: null,
      };
    }
  }
};

export default reducer;
