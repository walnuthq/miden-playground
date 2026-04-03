import useGlobalContext from "@/components/global-context/hook";
import {
  type Script,
  type ScriptExample,
  type ScriptType,
  type ProcedureExport,
  type MidenInput,
  defaultScript,
  invokeProcedureCustomTransactionScript,
  type PackageSource,
  compiledPackageToScript,
} from "@/lib/types/script";
import { clientExecuteTransaction } from "@/lib/web-client";
import {
  createScript,
  compileScript as apiCompileScript,
  deleteScript as apiDeleteScript,
  importScriptsFromPackageSources as apiImportScriptsFromPackageSources,
  importScriptsFromGithubRepo as apiImportScriptsFromGithubRepo,
} from "@/lib/api";
import useMidenSdk from "@/hooks/use-miden-sdk";
import useTransactions from "@/hooks/use-transactions";
import useTutorials from "@/hooks/use-tutorials";
import useWebClient from "@/hooks/use-web-client";
import { fromBase64 } from "@/lib/utils";

const useScripts = () => {
  const { midenSdk } = useMidenSdk();
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
    readOnlyProcedureDigest,
    readOnlyProcedureResult,
    dispatch,
  } = useGlobalContext();
  const { client } = useWebClient();
  const { submitNewTransaction } = useTransactions();
  const { tutorialId } = useTutorials();
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
    const { script, error } = await createScript({
      name,
      type,
      example,
      tutorialId,
    });
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
    const { script: compiledScript, error } = await apiCompileScript(script);
    if (compiledScript) {
      dispatch({
        type: "UPDATE_SCRIPT",
        payload: {
          script: compiledPackageToScript(compiledScript),
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
  const invokeProcedure = async ({
    senderAccountId,
    script,
    procedureExport,
    procedureInputs = [],
    foreignAccounts = [],
  }: {
    senderAccountId: string;
    script: Script;
    procedureExport: ProcedureExport;
    procedureInputs?: MidenInput[];
    foreignAccounts?: string[];
  }) => {
    dispatch({ type: "SUBMITTING_TRANSACTION" });
    await client.syncState();
    try {
      const {
        TransactionRequestBuilder,
        AccountStorageRequirements,
        ForeignAccount,
        AccountId,
        MidenArrays,
        Package,
      } = midenSdk;
      const builder = client.createCodeBuilder();
      const contractName = script.name.replaceAll("-", "_");
      const accountComponentLibrary = script.masm
        ? builder.buildLibrary(
            `external_contract::${contractName}`,
            script.masm,
          )
        : Package.deserialize(fromBase64(script.masp)).asLibrary();
      builder.linkDynamicLibrary(accountComponentLibrary);
      const transactionScript = builder.compileTxScript(
        invokeProcedureCustomTransactionScript({
          contractName: script.masm ? contractName : undefined,
          procedureExport,
          procedureInputs,
        }),
      );
      let transactionRequestBuilder =
        new TransactionRequestBuilder().withCustomScript(transactionScript);
      if (foreignAccounts.length > 0) {
        transactionRequestBuilder =
          transactionRequestBuilder.withForeignAccounts(
            new MidenArrays.ForeignAccountArray(
              foreignAccounts.map((foreignAccountId) =>
                ForeignAccount.public(
                  AccountId.fromHex(foreignAccountId),
                  new AccountStorageRequirements(),
                ),
              ),
            ),
          );
      }
      const transactionRequest = transactionRequestBuilder.build();
      const transactionResult = await clientExecuteTransaction({
        client,
        accountId: senderAccountId,
        transactionRequest,
        midenSdk,
      });
      return submitNewTransaction({
        accountId: senderAccountId,
        transactionRequest,
        transactionResult,
      });
    } catch (error) {
      console.error(error);
      dispatch({ type: "TRANSACTION_SUBMITTED" });
      throw error;
    }
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
  const importScriptsFromGithubRepo = async ({
    githubRepoUrl,
    projectDir,
  }: {
    githubRepoUrl: string;
    projectDir?: string;
  }) => {
    const { scripts, error } = await apiImportScriptsFromGithubRepo({
      githubRepoUrl,
      projectDir,
    });
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
    digest,
    result,
  }: {
    digest: string;
    result: string;
  }) =>
    dispatch({
      type: "SET_READ_ONLY_PROCEDURE_RESULT",
      payload: { digest, result },
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
    invokeProcedure,
    openInvokeProcedureArgumentsDialog,
    closeInvokeProcedureArgumentsDialog,
    openAddDependencyDialog,
    closeAddDependencyDialog,
    openImportProjectDialog,
    closeImportProjectDialog,
    importScriptsFromPackageSources,
    importScriptsFromGithubRepo,
    setReadOnlyProcedureResult,
  };
};

export default useScripts;
