import { type State } from "@/lib/types/state";
import { type InputNote } from "@/lib/types/note";

export type NoteAction =
  | { type: "ADD_NOTE"; payload: { inputNote: InputNote } }
  | { type: "OPEN_EXPORT_NOTE_DIALOG" }
  | { type: "CLOSE_EXPORT_NOTE_DIALOG" }
  | { type: "OPEN_IMPORT_NOTE_DIALOG" }
  | { type: "CLOSE_IMPORT_NOTE_DIALOG" }
  | { type: "OPEN_CREATE_NOTE_DIALOG" }
  | { type: "CLOSE_CREATE_NOTE_DIALOG" }
  | {
      type: "OPEN_VERIFY_NOTE_SCRIPT_DIALOG";
      payload: { noteId: string };
    }
  | { type: "CLOSE_VERIFY_NOTE_SCRIPT_DIALOG" }
  | {
      type: "VERIFY_NOTE_SCRIPT";
      payload: { noteId: string; scriptId: string };
    };

const reducer = (state: State, action: NoteAction): State => {
  switch (action.type) {
    case "ADD_NOTE": {
      return {
        ...state,
        inputNotes: [...state.inputNotes, action.payload.inputNote],
      };
    }
    case "OPEN_EXPORT_NOTE_DIALOG": {
      return {
        ...state,
        exportNoteDialogOpen: true,
      };
    }
    case "CLOSE_EXPORT_NOTE_DIALOG": {
      return {
        ...state,
        exportNoteDialogOpen: false,
      };
    }
    case "OPEN_IMPORT_NOTE_DIALOG": {
      return {
        ...state,
        importNoteDialogOpen: true,
      };
    }
    case "CLOSE_IMPORT_NOTE_DIALOG": {
      return {
        ...state,
        importNoteDialogOpen: false,
      };
    }
    case "OPEN_CREATE_NOTE_DIALOG": {
      return {
        ...state,
        createNoteDialogOpen: true,
      };
    }
    case "CLOSE_CREATE_NOTE_DIALOG": {
      return {
        ...state,
        createNoteDialogOpen: false,
      };
    }
    case "OPEN_VERIFY_NOTE_SCRIPT_DIALOG": {
      return {
        ...state,
        verifyNoteScriptDialogOpen: true,
        verifyNoteScriptDialogNoteId: action.payload.noteId,
      };
    }
    case "CLOSE_VERIFY_NOTE_SCRIPT_DIALOG": {
      return {
        ...state,
        verifyNoteScriptDialogOpen: false,
        verifyNoteScriptDialogNoteId: "",
      };
    }
    case "VERIFY_NOTE_SCRIPT": {
      const index = state.inputNotes.findIndex(
        ({ id }) => id === action.payload.noteId
      );
      const note = state.inputNotes[index]!;
      return {
        ...state,
        inputNotes: [
          ...state.inputNotes.slice(0, index),
          { ...note, scriptId: action.payload.scriptId },
          ...state.inputNotes.slice(index + 1),
        ],
      };
    }
  }
};

export default reducer;
