import { kebabCase } from "lodash";
import useGlobalContext from "@/components/global-context/hook";
import {
  type Script,
  type ScriptExample,
  type ScriptType,
  type Export,
  type MidenInput,
  defaultScript,
  invokeProcedureCustomTransactionScript,
} from "@/lib/types/script";
import { clientExecuteTransaction } from "@/lib/web-client";
import { createScript, deleteScript as apiDeleteScript } from "@/lib/api";
import useMidenSdk from "@/hooks/use-miden-sdk";
import useTransactions from "@/hooks/use-transactions";
import useWebClient from "@/hooks/use-web-client";

const useScripts = () => {
  const { midenSdk } = useMidenSdk();
  const {
    scripts,
    createScriptDialogOpen,
    deleteScriptAlertDialogOpen,
    deleteScriptAlertDialogScriptId,
    invokeProcedureArgumentsDialogOpen,
    invokeProcedureArgumentsDialogSenderAccountId,
    invokeProcedureArgumentsDialogScriptId,
    invokeProcedureArgumentsDialogProcedure,
    dispatch,
  } = useGlobalContext();
  const { client } = useWebClient();
  const { submitNewTransaction } = useTransactions();
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
    const packageName = example ?? kebabCase(name);
    const { id, rust } = await createScript({ packageName, type, example });
    const script: Script = {
      ...defaultScript(),
      id,
      name,
      packageName,
      type,
      rust,
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
    const script = scripts.find(({ id }) => id === scriptId);
    if (!script) {
      throw new Error("Error: Script not found");
    }
    const deletedScriptId = await apiDeleteScript(scriptId);
    dispatch({ type: "DELETE_SCRIPT", payload: { scriptId: deletedScriptId } });
    return script;
  };
  const invokeProcedure = async ({
    senderAccountId,
    scriptId,
    procedureExport,
    procedureInputs = [],
    foreignAccounts = [],
  }: {
    senderAccountId: string;
    scriptId: string;
    procedureExport: Export;
    procedureInputs?: MidenInput[];
    foreignAccounts?: string[];
  }) => {
    const script = scripts.find(({ id }) => id === scriptId);
    if (!script) {
      throw new Error("Script not found");
    }
    const {
      TransactionRequestBuilder,
      AccountStorageRequirements,
      ForeignAccount,
      AccountId,
      MidenArrays,
    } = midenSdk;
    const builder = client.createScriptBuilder();
    const contractName = script.id.replaceAll("-", "_");
    const accountComponentLibrary = builder.buildLibrary(
      `external_contract::${contractName}`,
      script.masm
    );
    builder.linkDynamicLibrary(accountComponentLibrary);
    const transactionScript = builder.compileTxScript(
      invokeProcedureCustomTransactionScript({
        contractName,
        procedureExport,
        procedureInputs,
      })
    );
    let transactionRequestBuilder =
      new TransactionRequestBuilder().withCustomScript(transactionScript);
    if (foreignAccounts.length > 0) {
      transactionRequestBuilder = transactionRequestBuilder.withForeignAccounts(
        new MidenArrays.ForeignAccountArray(
          foreignAccounts.map((foreignAccountId) =>
            ForeignAccount.public(
              AccountId.fromHex(foreignAccountId),
              new AccountStorageRequirements()
            )
          )
        )
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
  };
  const openInvokeProcedureArgumentsDialog = ({
    senderAccountId,
    scriptId,
    procedureExport,
  }: {
    senderAccountId: string;
    scriptId: string;
    procedureExport: Export;
  }) =>
    dispatch({
      type: "OPEN_INVOKE_PROCEDURE_ARGUMENTS_DIALOG",
      payload: { senderAccountId, scriptId, procedureExport },
    });
  const closeInvokeProcedureArgumentsDialog = () =>
    dispatch({
      type: "CLOSE_INVOKE_PROCEDURE_ARGUMENTS_DIALOG",
    });
  return {
    scripts,
    createScriptDialogOpen,
    deleteScriptAlertDialogOpen,
    deleteScriptAlertDialogScriptId,
    invokeProcedureArgumentsDialogOpen,
    invokeProcedureArgumentsDialogSenderAccountId,
    invokeProcedureArgumentsDialogScriptId,
    invokeProcedureArgumentsDialogProcedure,
    openCreateScriptDialog,
    closeCreateScriptDialog,
    openDeleteScriptAlertDialog,
    closeDeleteScriptAlertDialog,
    newScript,
    updateScript,
    deleteScript,
    invokeProcedure,
    openInvokeProcedureArgumentsDialog,
    closeInvokeProcedureArgumentsDialog,
  };
};

export default useScripts;
