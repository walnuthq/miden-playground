import type {
  TransactionRequest as WasmTransactionRequestType,
  TransactionResult as WasmTransactionResultType,
} from "@miden-sdk/miden-sdk";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Spinner } from "@workspace/ui/components/spinner";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import ProcedureArgumentsForm from "@/components/procedures/procedure-arguments-form";
import TransactionPreviewForm from "@/components/transactions/transaction-preview-form";
import useNetwork from "@/hooks/use-network";
import useScripts from "@/hooks/use-scripts";
import useTransactions from "@/hooks/use-transactions";
import { midenExplorerUrl } from "@/lib/constants";
import type { MidenInput, ProcedureExport, Script } from "@/lib/types/script";
import {
  cleanExecutionError,
  encodeProcedureArguments,
  type ProcedureArguments,
  procedureArgumentsReady,
  procedureResult,
  procedureParams,
} from "@/lib/utils/procedure-inputs";
import { formatProcedureExportPath } from "@/lib/utils/script";
import { accountIdParts } from "@/lib/web-client";

// A procedure invoked from an account's Components tab. A read-only one with
// arguments asks for them, runs locally and shows its result in the row. A
// state-changing one previews its transaction (after its arguments, if it
// takes any), then submits it on Submit. Each opening is a fresh instance (see
// the `key` below), so nothing carries over from one procedure to the next.
const InvokeProcedureArgumentsDialog = () => {
  const {
    invokeProcedureArgumentsDialogOpen,
    invokeProcedureArgumentsDialogSenderAccountId: senderAccountId,
    invokeProcedureArgumentsDialogScript: script,
    invokeProcedureArgumentsDialogProcedure: procedureExport,
    closeInvokeProcedureArgumentsDialog,
  } = useScripts();
  if (!script || !procedureExport) {
    return null;
  }
  return (
    <Dialog
      open={invokeProcedureArgumentsDialogOpen}
      modal={false}
      disablePointerDismissal
      onOpenChange={(open) => !open && closeInvokeProcedureArgumentsDialog()}
    >
      <InvokeProcedureDialogContent
        key={`${senderAccountId}:${procedureExport.digest}`}
        senderAccountId={senderAccountId}
        script={script}
        procedureExport={procedureExport}
        onClose={closeInvokeProcedureArgumentsDialog}
      />
    </Dialog>
  );
};

const InvokeProcedureDialogContent = ({
  senderAccountId,
  script,
  procedureExport,
  onClose,
}: {
  senderAccountId: string;
  script: Script;
  procedureExport: ProcedureExport;
  onClose: () => void;
}) => {
  const { readWord } = useTransactions();
  const { networkId } = useNetwork();
  const { previewProcedure, setReadOnlyProcedureResult } = useScripts();
  const params = procedureParams(procedureExport);
  const hasArguments = params.length > 0;
  const readOnly = procedureExport.readOnly;
  // A state-changing procedure without arguments opens on its preview.
  const [step, setStep] = useState<"arguments" | "preview">(
    hasArguments || readOnly ? "arguments" : "preview",
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [args, setArgs] = useState<ProcedureArguments>({});
  // Wasm objects: kept here, dropped with the instance when the dialog closes.
  const [transactionRequest, setTransactionRequest] =
    useState<WasmTransactionRequestType | null>(null);
  const [transactionResult, setTransactionResult] =
    useState<WasmTransactionResultType | null>(null);
  const ready = procedureArgumentsReady(params, args);
  // False once the dialog is closed: a preview or a submit that ends after it
  // leaves the page alone (it would close a dialog opened since).
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const preview = async (procedureInputs: MidenInput[]) => {
    setLoading(true);
    setError("");
    try {
      const { transactionRequest, transactionResult } = await previewProcedure({
        senderAccountId,
        script,
        procedureExport,
        procedureInputs,
      });
      if (!mounted.current) {
        return;
      }
      setTransactionRequest(transactionRequest);
      setTransactionResult(transactionResult);
      setStep("preview");
    } catch (error) {
      console.error(error);
      if (!mounted.current) {
        return;
      }
      const message = cleanExecutionError(
        error instanceof Error ? error.message : String(error),
      );
      if (hasArguments) {
        toast.error("Transaction failed.", { description: message });
      } else {
        // No form to go back to: the dialog shows it, with Retry.
        setError(message);
      }
    } finally {
      if (mounted.current) {
        setLoading(false);
      }
    }
  };
  // Without arguments, the preview runs as the dialog opens, once: the ref
  // survives React's strict-mode double effect, which would execute twice.
  const autoPreviewStarted = useRef(false);
  useEffect(() => {
    if (hasArguments || readOnly || autoPreviewStarted.current) {
      return;
    }
    autoPreviewStarted.current = true;
    preview([]);
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- runs once per instance, which is keyed on the procedure
  }, []);
  const previewReady =
    step === "preview" && transactionRequest && transactionResult;
  return (
    // A column that can shrink to the dialog's width (a grid's can't, by
    // default): the preview's wide tables scroll inside it instead of pushing
    // the footer's Submit off a phone's screen. Taller than the screen, the
    // dialog scrolls.
    <DialogContent
      data-modal="false"
      className="max-h-[calc(100dvh-2rem)] grid-cols-[minmax(0,1fr)] overflow-y-auto sm:max-w-160"
    >
      <DialogHeader>
        <DialogTitle>
          {step === "arguments"
            ? "Invoke Procedure"
            : `Preview ${formatProcedureExportPath(procedureExport.path)}`}
        </DialogTitle>
        <DialogDescription>
          {step === "arguments" ? (
            <>
              Invoke a procedure with custom arguments.
              {procedureExport.callsForeign === true &&
                " It calls another account's procedures, which works when that account is public and on chain."}
            </>
          ) : (
            "Preview the outcome of this transaction, then submit it."
          )}
        </DialogDescription>
      </DialogHeader>
      {step === "arguments" && (
        <form
          id="invoke-procedure-form"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!ready) {
              return;
            }
            const procedureInputs = encodeProcedureArguments({
              params,
              args,
              accountIdParts,
            });
            if (!readOnly) {
              await preview(procedureInputs);
              return;
            }
            setLoading(true);
            try {
              const word = await readWord({
                accountId: senderAccountId,
                script,
                procedureExport,
                procedureInputs,
              });
              setReadOnlyProcedureResult({
                accountId: senderAccountId,
                digest: procedureExport.digest,
                result: procedureResult(
                  procedureExport,
                  Array.from(word.toU64s()),
                ),
              });
            } catch (error) {
              console.error(error);
              setReadOnlyProcedureResult({
                accountId: senderAccountId,
                digest: procedureExport.digest,
                result: "ERROR",
              });
            }
            setLoading(false);
            onClose();
          }}
        >
          <ProcedureArgumentsForm
            idPrefix="invoke-procedure"
            params={params}
            value={args}
            onChange={setArgs}
            disabled={loading}
          />
        </form>
      )}
      {step === "preview" && !previewReady && loading && (
        <p className="flex items-center gap-2 text-muted-foreground text-sm">
          <Spinner />
          Executing the transaction…
        </p>
      )}
      {step === "preview" && !previewReady && error && (
        <div className="space-y-2 text-sm">
          <p className="font-semibold text-destructive">Transaction failed.</p>
          <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-md bg-muted p-2 text-xs">
            {error}
          </pre>
        </div>
      )}
      {previewReady && (
        <TransactionPreviewForm
          formId="invoke-procedure-preview-form"
          executingAccountId={senderAccountId}
          transactionRequest={transactionRequest}
          transactionResult={transactionResult}
          setLoading={setLoading}
          onSubmitted={(transactionRecord) => {
            toast("Transaction submitted.", {
              action: {
                label: "View on MidenScan",
                onClick: () =>
                  window.open(
                    `${midenExplorerUrl(networkId)}/tx/${transactionRecord.id().toHex()}`,
                    "_blank",
                    "noreferrer",
                  ),
              },
            });
            if (mounted.current) {
              onClose();
            }
          }}
        />
      )}
      {step === "arguments" ? (
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            Cancel
          </DialogClose>
          <Button
            form="invoke-procedure-form"
            type="submit"
            disabled={loading || !ready}
          >
            {loading && <Spinner />}
            {readOnly
              ? loading
                ? "Invoking…"
                : "Invoke"
              : loading
                ? "Previewing…"
                : "Preview"}
          </Button>
        </DialogFooter>
      ) : (
        <DialogFooter>
          <div className="flex w-full justify-between">
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
            <div className="flex gap-2">
              {hasArguments && (
                <Button
                  variant="outline"
                  disabled={loading}
                  onClick={() => {
                    setTransactionRequest(null);
                    setTransactionResult(null);
                    setStep("arguments");
                  }}
                >
                  Back
                </Button>
              )}
              {!previewReady && error && (
                <Button disabled={loading} onClick={() => preview([])}>
                  Retry
                </Button>
              )}
              {previewReady && (
                <Button
                  form="invoke-procedure-preview-form"
                  type="submit"
                  disabled={loading}
                >
                  {loading && <Spinner />}
                  {loading ? "Submitting…" : "Submit"}
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      )}
    </DialogContent>
  );
};

export default InvokeProcedureArgumentsDialog;
