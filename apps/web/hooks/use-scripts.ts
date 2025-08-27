import { kebabCase, update } from "lodash";
import useGlobalContext from "@/components/global-context/hook";
import { type Script, type ScriptStatus, type ScriptType } from "@/lib/types";

const useScripts = () => {
  const { scripts, createScriptDialogOpen, dispatch } = useGlobalContext();
  const openCreateScriptDialog = () =>
    dispatch({ type: "OPEN_CREATE_SCRIPT_DIALOG" });
  const closeCreateScriptDialog = () =>
    dispatch({ type: "CLOSE_CREATE_SCRIPT_DIALOG" });
  const newScript = ({ name, type }: { name: string; type: ScriptType }) => {
    const script = {
      id: kebabCase(name),
      name,
      type,
      status: "draft" as ScriptStatus,
      content: "",
      masm: "",
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
  return {
    scripts,
    createScriptDialogOpen,
    openCreateScriptDialog,
    closeCreateScriptDialog,
    newScript,
    updateScript,
  };
};

export default useScripts;
