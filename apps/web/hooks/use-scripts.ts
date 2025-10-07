import { kebabCase } from "lodash";
import useGlobalContext from "@/components/global-context/hook";
import {
  type Script,
  type ScriptExample,
  type ScriptType,
  type Procedure,
  defaultScript,
  invokeProcedureCustomTransactionScript,
} from "@/lib/types/script";
import { createScript, deleteScript as apiDeleteScript } from "@/lib/api";
import counterMapContract from "@/lib/types/default-scripts/counter-map-contract";
import useTransactions from "@/hooks/use-transactions";
import { COUNTER_CONTRACT_ID } from "@/lib/constants";

const useScripts = () => {
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
  const { newCustomTransactionRequest, submitTransaction } = useTransactions();
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
    example?: ScriptExample;
  }) => {
    const packageName = example ?? kebabCase(name);
    const { id, rust } = await createScript(packageName, example);
    const script: Script = {
      ...defaultScript(),
      id,
      name,
      packageName,
      type,
      rust,
      dependencies: example === "p2id-note" ? ["basic-wallet"] : [],
      // TODO remove mock
      procedures:
        example === "counter-contract" ? counterMapContract.procedures : [],
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
    procedure,
  }: {
    senderAccountId: string;
    scriptId: string;
    procedure: Procedure;
  }) => {
    const script = scripts.find(({ id }) => id === scriptId);
    if (!script) {
      throw new Error("Script not found");
    }
    const {
      TransactionKernel: WasmTransactionKernel,
      AssemblerUtils: WasmAssemblerUtils,
      TransactionScript: WasmTransactionScript,
      TransactionRequestBuilder: WasmTransactionRequestBuilder,
      AccountStorageRequirements: WasmAccountStorageRequirements,
      ForeignAccount: WasmForeignAccount,
      AccountId: WasmAccountId,
    } = await import("@demox-labs/miden-sdk");
    const assembler = WasmTransactionKernel.assembler();
    const contractName = script.id.replaceAll("-", "_");
    const accountComponentLibrary =
      WasmAssemblerUtils.createAccountComponentLibrary(
        assembler,
        `external_contract::${contractName}`,
        script.masm
      );
    const transactionScript = WasmTransactionScript.compile(
      invokeProcedureCustomTransactionScript(contractName, procedure),
      assembler.withLibrary(accountComponentLibrary)
    );
    let transactionRequestBuilder =
      new WasmTransactionRequestBuilder().withCustomScript(transactionScript);
    if (procedure.foreignAccounts) {
      transactionRequestBuilder = transactionRequestBuilder.withForeignAccounts(
        procedure.foreignAccounts.map((foreignAccountId) =>
          WasmForeignAccount.public(
            WasmAccountId.fromHex(foreignAccountId),
            new WasmAccountStorageRequirements()
          )
        )
      );
    }
    const storageRequirements = new WasmAccountStorageRequirements();
    transactionRequestBuilder = transactionRequestBuilder.withForeignAccounts([
      WasmForeignAccount.public(
        WasmAccountId.fromHex(COUNTER_CONTRACT_ID),
        storageRequirements
      ),
    ]);
    const transactionRequest = transactionRequestBuilder.build();
    const transactionResult = await newCustomTransactionRequest({
      senderAccountId,
      transactionRequest,
    });
    return submitTransaction(transactionResult);
  };
  const openInvokeProcedureArgumentsDialog = ({
    senderAccountId,
    scriptId,
    procedure,
  }: {
    senderAccountId: string;
    scriptId: string;
    procedure: Procedure;
  }) =>
    dispatch({
      type: "OPEN_INVOKE_PROCEDURE_ARGUMENTS_DIALOG",
      payload: { senderAccountId, scriptId, procedure },
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
