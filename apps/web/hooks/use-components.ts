import { kebabCase } from "lodash";
import useGlobalContext from "@/components/global-context/hook";
import { type Component, type ComponentType } from "@/lib/types";

const useComponents = () => {
  const {
    components,
    createComponentDialogOpen,
    upsertStorageSlotDialogOpen,
    upsertStorageSlotDialogComponentId,
    upsertStorageSlotDialogStorageSlotIndex,
    dispatch,
  } = useGlobalContext();
  const openCreateComponentDialog = () =>
    dispatch({ type: "OPEN_CREATE_COMPONENT_DIALOG" });
  const closeCreateComponentDialog = () =>
    dispatch({ type: "CLOSE_CREATE_COMPONENT_DIALOG" });
  const openUpsertStorageSlotDialog = ({
    componentId,
    storageSlotIndex,
  }: {
    componentId: string;
    storageSlotIndex: number;
  }) =>
    dispatch({
      type: "OPEN_UPSERT_STORAGE_SLOT_DIALOG",
      payload: { componentId, storageSlotIndex },
    });
  const closeUpsertStorageSlotDialog = () =>
    dispatch({ type: "CLOSE_UPSERT_STORAGE_SLOT_DIALOG" });
  const newComponent = ({
    name,
    type,
    scriptId,
  }: {
    name: string;
    type: ComponentType;
    scriptId: string;
  }) => {
    const component = {
      id: kebabCase(name),
      name,
      type,
      scriptId,
      storageSlots: [],
      updatedAt: Date.now(),
    };
    dispatch({
      type: "NEW_COMPONENT",
      payload: { component },
    });
    return component;
  };
  const updateComponent = (component: Component) =>
    dispatch({
      type: "UPDATE_COMPONENT",
      payload: { component },
    });
  return {
    components,
    createComponentDialogOpen,
    upsertStorageSlotDialogOpen,
    upsertStorageSlotDialogComponentId,
    upsertStorageSlotDialogStorageSlotIndex,
    openCreateComponentDialog,
    closeCreateComponentDialog,
    openUpsertStorageSlotDialog,
    closeUpsertStorageSlotDialog,
    newComponent,
    updateComponent,
  };
};

export default useComponents;
