import { type Component } from "@/lib/types/component";
import { type State } from "@/lib/types/state";

export type ComponentAction =
  | {
      type: "OPEN_CREATE_COMPONENT_DIALOG";
    }
  | {
      type: "CLOSE_CREATE_COMPONENT_DIALOG";
    }
  | {
      type: "OPEN_UPSERT_STORAGE_SLOT_DIALOG";
      payload: { componentId: string; storageSlotIndex: number };
    }
  | {
      type: "CLOSE_UPSERT_STORAGE_SLOT_DIALOG";
    }
  | {
      type: "NEW_COMPONENT";
      payload: { component: Component };
    }
  | {
      type: "UPDATE_COMPONENT";
      payload: { component: Component };
    };

const reducer = (state: State, action: ComponentAction): State => {
  switch (action.type) {
    case "OPEN_CREATE_COMPONENT_DIALOG": {
      return {
        ...state,
        createComponentDialogOpen: true,
      };
    }
    case "CLOSE_CREATE_COMPONENT_DIALOG": {
      return {
        ...state,
        createComponentDialogOpen: false,
      };
    }
    case "OPEN_UPSERT_STORAGE_SLOT_DIALOG": {
      return {
        ...state,
        upsertStorageSlotDialogOpen: true,
        upsertStorageSlotDialogComponentId: action.payload.componentId,
        upsertStorageSlotDialogStorageSlotIndex:
          action.payload.storageSlotIndex,
      };
    }
    case "CLOSE_UPSERT_STORAGE_SLOT_DIALOG": {
      return {
        ...state,
        upsertStorageSlotDialogOpen: false,
        upsertStorageSlotDialogComponentId: "",
        upsertStorageSlotDialogStorageSlotIndex: -1,
      };
    }
    case "NEW_COMPONENT": {
      return {
        ...state,
        components: [...state.components, action.payload.component],
      };
    }
    case "UPDATE_COMPONENT": {
      const index = state.components.findIndex(
        ({ id }) => id === action.payload.component.id
      );
      return {
        ...state,
        components: [
          ...state.components.slice(0, index),
          { ...action.payload.component, updatedAt: Date.now() },
          ...state.components.slice(index + 1),
        ],
      };
    }
  }
};

export default reducer;
