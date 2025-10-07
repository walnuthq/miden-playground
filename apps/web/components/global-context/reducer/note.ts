import { type State } from "@/lib/types/state";

export type NoteAction =
  | { type: "OPEN_EXPORT_NOTE_DIALOG" }
  | { type: "CLOSE_EXPORT_NOTE_DIALOG" }
  | { type: "OPEN_IMPORT_NOTE_DIALOG" }
  | { type: "CLOSE_IMPORT_NOTE_DIALOG" }
  | { type: "OPEN_CREATE_NOTE_DIALOG" }
  | { type: "CLOSE_CREATE_NOTE_DIALOG" };

const reducer = (state: State, action: NoteAction): State => {
  switch (action.type) {
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
  }
};

export default reducer;
