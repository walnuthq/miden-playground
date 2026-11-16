import {
  AccountId as WasmAccountId,
  TransactionRequestBuilder as WasmTransactionRequestBuilder,
} from "@miden-sdk/miden-sdk";
import { useMiden } from "@miden-sdk/react";
import useGlobalContext from "@/components/global-context/hook";
import {
  compileScript as apiCompileScript,
  deleteScript as apiDeleteScript,
  importScriptsFromPackageSources as apiImportScriptsFromPackageSources,
  createScript,
} from "@/lib/api";
import type {
  MidenInput,
  PackageSource,
  ProcedureExport,
  Script,
  ScriptExample,
  ScriptType,
} from "@/lib/types/script";
import { compiledPackageToScript, defaultScript } from "@/lib/utils/script";
import { scriptSource } from "@/lib/utils/script-files";
import { procedureCallScript } from "@/lib/web-client";

const useScripts = () => {
  const {
    scripts,
    createScriptDialogOpen,
    deleteScriptAlertDialogOpen,
    deleteScriptAlertDialogScriptId,
    invokeProcedureArgumentsDialogOpen,
    invokeProcedureArgumentsDialogSenderAccountId,
    invokeProcedureArgumentsDialogScript,
    invokeProcedureArgumentsDialogProcedure,
    addDependencyDialogOpen,
    addDependencyDialogScriptId,
    importProjectDialogOpen,
    readOnlyProcedureAccountId,
    readOnlyProcedureDigest,
    readOnlyProcedureResult,
    dispatch,
  } = useGlobalContext();
  const { client } = useMiden();
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
    example: ScriptExample | "none";
  }) => {
    const { script, error } = await createScript({ name, type, example });
    if (script) {
      dispatch({
        type: "NEW_SCRIPT",
        payload: {
          script: { ...defaultScript(), ...script },
        },
      });
    }
    return { script, error };
  };
  const compileScript = async (script: Script) => {
    const source = scriptSource(script);
    const dependencyIds = script.dependencies.map(({ id }) => id);
    const { script: compiledScript, error } = await apiCompileScript(script);
    if (compiledScript) {
      dispatch({
        type: "SCRIPT_COMPILED",
        payload: {
          script: compiledPackageToScript(compiledScript),
          source,
          dependencyIds,
        },
      });
    }
    return { script: compiledScript, error };
  };
  const updateScript = (script: Partial<Script>) =>
    dispatch({
      type: "UPDATE_SCRIPT",
      payload: { script },
    });
  const deleteScript = async (scriptId: string) => {
    const { script, error } = await apiDeleteScript(scriptId);
    if (script) {
      dispatch({
        type: "DELETE_SCRIPT",
        payload: { scriptId: script.id },
      });
    }
    return { script, error };
  };
  // Executes a call to the procedure as a transaction of the sender, for a
  // preview: nothing is submitted (and `SUBMITTING_TRANSACTION`, which
  // disables every Invoke button, isn't dispatched). The preview's Submit hands
  // the request to `submitNewTransaction`, which executes it again.
  const previewProcedure = async ({
    senderAccountId,
    script,
    procedureExport,
    procedureInputs = [],
  }: {
    senderAccountId: string;
    script: Script;
    procedureExport: ProcedureExport;
    procedureInputs?: MidenInput[];
  }) => {
    if (!client) {
      throw new Error("MidenClient not ready");
    }
    const transactionScript = await procedureCallScript({
      client,
      script,
      procedureExport,
      procedureInputs,
    });
    // No foreign account is declared: the client fetches a public one from
    // the node when the procedure reaches it through FPI.
    const transactionRequest = new WasmTransactionRequestBuilder()
      .withCustomScript(transactionScript)
      .build();
    const transactionResult = await client.executeTransaction(
      WasmAccountId.fromHex(senderAccountId),
      transactionRequest,
    );
    return { transactionRequest, transactionResult };
  };
  const openInvokeProcedureArgumentsDialog = ({
    senderAccountId,
    script,
    procedureExport,
  }: {
    senderAccountId: string;
    script: Script;
    procedureExport: ProcedureExport;
  }) =>
    dispatch({
      type: "OPEN_INVOKE_PROCEDURE_ARGUMENTS_DIALOG",
      payload: { senderAccountId, script, procedureExport },
    });
  const closeInvokeProcedureArgumentsDialog = () =>
    dispatch({
      type: "CLOSE_INVOKE_PROCEDURE_ARGUMENTS_DIALOG",
    });
  const openAddDependencyDialog = ({ scriptId }: { scriptId: string }) =>
    dispatch({
      type: "OPEN_ADD_DEPENDENCY_DIALOG",
      payload: { scriptId },
    });
  const closeAddDependencyDialog = () =>
    dispatch({
      type: "CLOSE_ADD_DEPENDENCY_DIALOG",
    });
  const openImportProjectDialog = () =>
    dispatch({
      type: "OPEN_IMPORT_PROJECT_DIALOG",
    });
  const closeImportProjectDialog = () =>
    dispatch({
      type: "CLOSE_IMPORT_PROJECT_DIALOG",
    });
  const importScriptsFromPackageSources = async (
    packageSources: Record<string, PackageSource>,
  ) => {
    const { scripts, error } =
      await apiImportScriptsFromPackageSources(packageSources);
    if (scripts) {
      dispatch({
        type: "IMPORT_SCRIPTS",
        payload: {
          scripts: scripts.map((compiledScript) =>
            compiledPackageToScript(compiledScript),
          ),
        },
      });
    }
    return { scripts, error };
  };
  const setReadOnlyProcedureResult = ({
    accountId,
    digest,
    result,
  }: {
    accountId: string;
    digest: string;
    result: string;
  }) =>
    dispatch({
      type: "SET_READ_ONLY_PROCEDURE_RESULT",
      payload: { accountId, digest, result },
    });
  return {
    scripts,
    createScriptDialogOpen,
    deleteScriptAlertDialogOpen,
    deleteScriptAlertDialogScriptId,
    invokeProcedureArgumentsDialogOpen,
    invokeProcedureArgumentsDialogSenderAccountId,
    invokeProcedureArgumentsDialogScript,
    invokeProcedureArgumentsDialogProcedure,
    addDependencyDialogOpen,
    addDependencyDialogScriptId,
    importProjectDialogOpen,
    readOnlyProcedureAccountId,
    readOnlyProcedureDigest,
    readOnlyProcedureResult,
    openCreateScriptDialog,
    closeCreateScriptDialog,
    openDeleteScriptAlertDialog,
    closeDeleteScriptAlertDialog,
    newScript,
    compileScript,
    updateScript,
    deleteScript,
    previewProcedure,
    openInvokeProcedureArgumentsDialog,
    closeInvokeProcedureArgumentsDialog,
    openAddDependencyDialog,
    closeAddDependencyDialog,
    openImportProjectDialog,
    closeImportProjectDialog,
    importScriptsFromPackageSources,
    setReadOnlyProcedureResult,
  };
};

export default useScripts;
