import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Spinner } from "@workspace/ui/components/spinner";
import { TableRow, TableCell } from "@workspace/ui/components/table";
import type { Account } from "@/lib/types/account";
import type { Script, ProcedureExport } from "@/lib/types/script";
import { formatProcedureExportPath } from "@/lib/utils/script";
import type { Component } from "@/lib/types/component";
import { Button } from "@workspace/ui/components/button";
import useScripts from "@/hooks/use-scripts";
import useTransactions from "@/hooks/use-transactions";
import CopyButton from "@/components/lib/copy-button";
import { midenExplorerUrl } from "@/lib/constants";
import useNetwork from "@/hooks/use-network";

const ProceduresTableRow = ({
  account,
  component,
  script,
  procedureExport,
}: {
  account: Account;
  component: Component;
  script: Script;
  procedureExport: ProcedureExport;
}) => {
  const { networkId } = useNetwork();
  const {
    invokeProcedure,
    openInvokeProcedureArgumentsDialog,
    readOnlyProcedureDigest,
    readOnlyProcedureResult,
  } = useScripts();
  const { submittingTransaction, readWord } = useTransactions();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  useEffect(() => {
    if (
      procedureExport.digest === readOnlyProcedureDigest &&
      result !== readOnlyProcedureResult
    ) {
      setResult(readOnlyProcedureResult);
    }
  }, [
    procedureExport.digest,
    readOnlyProcedureDigest,
    result,
    readOnlyProcedureResult,
  ]);
  return (
    <TableRow key={procedureExport.path}>
      <TableCell>
        <div className="flex items-center gap-2">
          {formatProcedureExportPath(procedureExport.path)}
          <CopyButton
            content="Copy Procedure Digest"
            copy={procedureExport.digest}
          />
        </div>
      </TableCell>
      {account.components.includes("auth-no-auth") &&
        component.type === "account" && (
          <TableCell className="flex items-center justify-between gap-2">
            <span>{result}</span>
            <Button
              disabled={
                loading ||
                (account.isNew && procedureExport.readOnly) ||
                submittingTransaction
              }
              onClick={async () => {
                setLoading(true);
                if (procedureExport.signature.params.length === 0) {
                  if (procedureExport.readOnly) {
                    try {
                      const word = await readWord({
                        accountId: account.id,
                        script,
                        procedureExport,
                      });
                      if (procedureExport.signature.results.length === 1) {
                        const [felt = 0n] = word.toU64s();
                        setResult(felt.toString());
                      } else if (
                        procedureExport.signature.results.length === 4
                      ) {
                        setResult(word.toHex());
                      }
                    } catch (error) {
                      console.error(error);
                      setResult("ERROR");
                    }
                  } else {
                    try {
                      const transactionRecord = await invokeProcedure({
                        senderAccountId: account.id,
                        script,
                        procedureExport,
                      });
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
                      setResult("");
                    } catch (error) {
                      console.error(error);
                      setResult("ERROR");
                    }
                  }
                } else {
                  openInvokeProcedureArgumentsDialog({
                    senderAccountId: account.id,
                    script,
                    procedureExport,
                  });
                }
                setLoading(false);
              }}
            >
              {loading && <Spinner />}
              {loading ? "Invoking…" : "Invoke"}
            </Button>
          </TableCell>
        )}
    </TableRow>
  );
};

export default ProceduresTableRow;
