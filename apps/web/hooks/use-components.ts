import { kebabCase } from "lodash";
import useGlobalContext from "@/components/global-context/hook";
import type {
  Component,
  ComponentType,
  StorageSlot,
} from "@/lib/types/component";
import { defaultComponent } from "@/lib/utils/component";

const useComponents = () => {
  const {
    components,
    createComponentDialogOpen,
    upsertStorageSlotDialogOpen,
    upsertStorageSlotDialogComponentId,
    upsertStorageSlotDialogStorageSlotName,
    dispatch,
  } = useGlobalContext();
  const openCreateComponentDialog = () =>
    dispatch({ type: "OPEN_CREATE_COMPONENT_DIALOG" });
  const closeCreateComponentDialog = () =>
    dispatch({ type: "CLOSE_CREATE_COMPONENT_DIALOG" });
  const openUpsertStorageSlotDialog = ({
    componentId,
    storageSlotName,
  }: {
    componentId: string;
    storageSlotName: string;
  }) =>
    dispatch({
      type: "OPEN_UPSERT_STORAGE_SLOT_DIALOG",
      payload: { componentId, storageSlotName },
    });
  const closeUpsertStorageSlotDialog = () =>
    dispatch({ type: "CLOSE_UPSERT_STORAGE_SLOT_DIALOG" });
  const newComponent = ({
    name,
    type,
    scriptId,
    storageSlots = [],
  }: {
    name: string;
    type: ComponentType;
    scriptId: string;
    storageSlots?: StorageSlot[];
  }) => {
    const component: Component = {
      ...defaultComponent(),
      id: `${kebabCase(name)}_${crypto.randomUUID()}`,
      name,
      type,
      scriptId,
      storageSlots,
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
    upsertStorageSlotDialogStorageSlotName,
    openCreateComponentDialog,
    closeCreateComponentDialog,
    openUpsertStorageSlotDialog,
    closeUpsertStorageSlotDialog,
    newComponent,
    updateComponent,
  };
};

export default useComponents;
