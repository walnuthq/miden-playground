import { Button } from "@workspace/ui/components/button";
import { Spinner } from "@workspace/ui/components/spinner";
import { TableCell, TableRow } from "@workspace/ui/components/table";
import { useEffect, useState } from "react";
import CopyButton from "@/components/lib/copy-button";
import useScripts from "@/hooks/use-scripts";
import useTransactions from "@/hooks/use-transactions";
import type { Account } from "@/lib/types/account";
import type { ProcedureExport, Script } from "@/lib/types/script";
import { procedureParams, procedureResult } from "@/lib/utils/procedure-inputs";
import { formatProcedureExportPath } from "@/lib/utils/script";

// Whether the Playground can invoke the procedure on the account from its
// Components tab. Read-only procedures run locally against the account's
// stored state (`executeProgram`: no auth procedure, nothing submitted), so
// they work on any account, network accounts included. State-changing ones
// submit a transaction, which only No Auth accounts can sign here.
export const canInvokeProcedure = ({
  account,
  script,
  procedureExport,
}: {
  account: Account;
  script: Pick<Script, "type">;
  procedureExport: ProcedureExport;
}) =>
  script.type === "account-component" &&
  (procedureExport.readOnly || account.components.includes("auth-no-auth"));

const ProceduresTableRow = ({
  account,
  script,
  procedureExport,
  showResultColumn,
}: {
  account: Account;
  script: Script;
  procedureExport: ProcedureExport;
  // Whether the table has a Result column, which this row then fills.
  showResultColumn: boolean;
}) => {
  const {
    openInvokeProcedureArgumentsDialog,
    readOnlyProcedureAccountId,
    readOnlyProcedureDigest,
    readOnlyProcedureResult,
  } = useScripts();
  const { submittingTransaction, readWord } = useTransactions();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  useEffect(() => {
    if (
      account.id === readOnlyProcedureAccountId &&
      procedureExport.digest === readOnlyProcedureDigest &&
      result !== readOnlyProcedureResult
    ) {
      setResult(readOnlyProcedureResult);
    }
  }, [
    account.id,
    readOnlyProcedureAccountId,
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
          {/* Not on the narrowest phones, where it pushes the Invoke button
              off the table. */}
          <span className="contents max-sm:hidden">
            <CopyButton
              content="Copy Procedure Digest"
              copy={procedureExport.digest}
            />
          </span>
        </div>
      </TableCell>
      {showResultColumn &&
        !canInvokeProcedure({ account, script, procedureExport }) && (
          <TableCell />
        )}
      {canInvokeProcedure({ account, script, procedureExport }) && (
        <TableCell className="flex items-center justify-between gap-2">
          <span>{result}</span>
          <Button
            disabled={loading || submittingTransaction}
            onClick={async () => {
              // A state-changing procedure opens the dialog, with or without
              // arguments: it previews the transaction before submitting it.
              if (
                procedureParams(procedureExport).length > 0 ||
                !procedureExport.readOnly
              ) {
                openInvokeProcedureArgumentsDialog({
                  senderAccountId: account.id,
                  script,
                  procedureExport,
                });
                return;
              }
              setLoading(true);
              try {
                const word = await readWord({
                  accountId: account.id,
                  script,
                  procedureExport,
                });
                setResult(
                  procedureResult(procedureExport, Array.from(word.toU64s())),
                );
              } catch (error) {
                console.error(error);
                setResult("ERROR");
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
