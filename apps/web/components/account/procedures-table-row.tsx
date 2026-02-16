import { useState } from "react";
import { toast } from "sonner";
import { Spinner } from "@workspace/ui/components/spinner";
import { TableRow, TableCell } from "@workspace/ui/components/table";
import { type Account } from "@/lib/types/account";
import { type Script, type ProcedureExport } from "@/lib/types/script";
import { type Component } from "@/lib/types/component";
import { Button } from "@workspace/ui/components/button";
import useScripts from "@/hooks/use-scripts";
import useTransactions from "@/hooks/use-transactions";
import CopyButton from "@/components/lib/copy-button";
import { MIDEN_EXPLORER_URL } from "@/lib/constants";
import { formatProcedureExportPath } from "@/lib/utils";

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
  const { invokeProcedure, openInvokeProcedureArgumentsDialog } = useScripts();
  const { submittingTransaction, readWord } = useTransactions();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
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
      {account.components.includes("no-auth") &&
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
                if (procedureExport.readOnly) {
                  try {
                    const word = await readWord({
                      accountId: account.id,
                      procedureExport,
                    });
                    if (procedureExport.signature.results.length === 1) {
                      const [, , , felt = 0n] = word.toU64s();
                      setResult(felt.toString());
                    } else if (procedureExport.signature.results.length === 4) {
                      setResult(word.toHex());
                    }
                  } catch (error) {
                    console.error(error);
                    setResult("ERROR");
                  }
                } else if (procedureExport.signature.params.length === 0) {
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
                            `${MIDEN_EXPLORER_URL}/tx/${transactionRecord.id().toHex()}`,
                            "_blank",
                            "noopener noreferrer",
                          ),
                      },
                    });
                    setResult("");
                  } catch (error) {
                    console.error(error);
                    setResult("ERROR");
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
