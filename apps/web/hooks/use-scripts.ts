import { kebabCase } from "lodash";
import useGlobalContext from "@/components/global-context/hook";
import {
  type Script,
  type ScriptExample,
  type ScriptStatus,
  type ScriptType,
} from "@/lib/types/script";
import { createScript, deleteScript as apiDeleteScript } from "@/lib/api";

const useScripts = () => {
  const {
    scripts,
    createScriptDialogOpen,
    deleteScriptAlertDialogOpen,
    deleteScriptAlertDialogScriptId,
    dispatch,
  } = useGlobalContext();
  const openCreateScriptDialog = () =>
    dispatch({ type: "OPEN_CREATE_SCRIPT_DIALOG" });
  const closeCreateScriptDialog = () =>
    dispatch({ type: "CLOSE_CREATE_SCRIPT_DIALOG" });
  const openDeleteScriptAlertDialog = (scriptId: string) =>
    dispatch({
      type: "OPEN_DELETE_SCRIPT_ALERT_DIALOG",
      payload: { scriptId },
    });
  const closeDeleteScriptAlertDialog = () =>
    dispatch({ type: "CLOSE_DELETE_SCRIPT_ALERT_DIALOG" });
  const newScript = async ({
    name,
    type,
    example,
  }: {
    name: string;
    type: ScriptType;
    example: ScriptExample;
  }) => {
    const { id, rust } = await createScript(kebabCase(name), example);
    const script = {
      id,
      name,
      type,
      status: "draft" as ScriptStatus,
      rust,
      masm: "",
      error: "",
      root: "",
      updatedAt: Date.now(),
    };
    dispatch({
      type: "NEW_SCRIPT",
      payload: { script },
    });
    return script;
  };
  const updateScript = (script: Script) =>
    dispatch({
      type: "UPDATE_SCRIPT",
      payload: { script },
    });
  const deleteScript = async (scriptId: string) => {
    const script = scripts.find(({ id }) => id === deletedScriptId);
    if (!script) {
      throw new Error("Error: Script not found");
    }
    const deletedScriptId = await apiDeleteScript(scriptId);
    dispatch({ type: "DELETE_SCRIPT", payload: { scriptId: deletedScriptId } });
    return script;
  };
  return {
    scripts,
    createScriptDialogOpen,
    deleteScriptAlertDialogOpen,
    deleteScriptAlertDialogScriptId,
    openCreateScriptDialog,
    closeCreateScriptDialog,
    openDeleteScriptAlertDialog,
    closeDeleteScriptAlertDialog,
    newScript,
    updateScript,
    deleteScript,
  };
};

export default useScripts;
