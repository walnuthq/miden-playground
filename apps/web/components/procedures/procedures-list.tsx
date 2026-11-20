import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Spinner } from "@workspace/ui/components/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { useState } from "react";
import ProcedureArgumentsForm from "@/components/procedures/procedure-arguments-form";
import type { ProcedureExport } from "@/lib/types/script";
import {
  type ProcedureArguments,
  procedureArgumentsReady,
  procedureParams,
  withAccountIdsAmong,
} from "@/lib/utils/procedure-inputs";
import {
  formatProcedureExportPath,
  procedureSignature,
} from "@/lib/utils/script";

// What a row shows after a run: the returned value, or that it failed.
export type ProcedureOutcome = { value: string } | { error: string };

const ProcedureRows = ({
  idPrefix,
  procedureExport,
  disabled,
  blockedReason,
  simulatedAccounts,
  simulatedAssets,
  sandboxDisabledReason,
  onInvoke,
}: {
  idPrefix: string;
  procedureExport: ProcedureExport;
  disabled: boolean;
  blockedReason: ProceduresListProps["blockedReason"];
  simulatedAccounts: ProceduresListProps["simulatedAccounts"];
  simulatedAssets: ProceduresListProps["simulatedAssets"];
  sandboxDisabledReason: ProceduresListProps["sandboxDisabledReason"];
  onInvoke: ProceduresListProps["onInvoke"];
}) => {
  const name = formatProcedureExportPath(procedureExport.path);
  const reason = blockedReason?.(procedureExport);
  const params = procedureParams(procedureExport);
  const [args, setArgs] = useState<ProcedureArguments>({});
  const sandboxReason = sandboxDisabledReason?.(procedureExport);
  // A sandbox account picked before the rule applied (a recompile changed
  // the procedure): cleared during render, before it can run.
  if (sandboxReason !== undefined) {
    const allowed = withAccountIdsAmong(
      args,
      new Set(
        [...(simulatedAccounts ?? []), ...(simulatedAssets ?? [])].map(
          ({ value }) => value,
        ),
      ),
    );
    if (allowed !== args) {
      setArgs(allowed);
    }
  }
  const [running, setRunning] = useState(false);
  const [outcome, setOutcome] = useState<ProcedureOutcome>();
  return (
    <>
      <TableRow className={params.length > 0 ? "border-b-0" : undefined}>
        {/* A long name breaks rather than widen the table past a phone's
            screen, its Invoke button and the arguments' fields with it. */}
        <TableCell className="whitespace-normal wrap-anywhere">
          {/* The badge goes under the name on a phone. */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {name}
            {procedureExport.readOnly && (
              <Badge variant="outline">Read-only</Badge>
            )}
          </div>
          {/* Under the name: the Signature column is hidden on a phone. */}
          {reason && (
            <p className="mt-1 text-xs text-muted-foreground">{reason}</p>
          )}
        </TableCell>
        <TableCell className="max-sm:hidden">
          <pre>{procedureSignature(procedureExport)}</pre>
        </TableCell>
        <TableCell
          className="max-w-24 truncate font-mono sm:max-w-48"
          title={outcome && "value" in outcome ? outcome.value : undefined}
        >
          {outcome &&
            ("value" in outcome ? (
              outcome.value
            ) : (
              <span className="text-destructive">{outcome.error}</span>
            ))}
        </TableCell>
        <TableCell className="text-right">
          <Button
            size="sm"
            aria-label={`Invoke ${name}`}
            disabled={
              disabled ||
              reason !== undefined ||
              running ||
              !procedureArgumentsReady(params, args)
            }
            onClick={async () => {
              setRunning(true);
              try {
                setOutcome(await onInvoke(procedureExport, args));
              } finally {
                setRunning(false);
              }
            }}
          >
            {running && <Spinner />}
            {running ? "Invoking…" : "Invoke"}
          </Button>
        </TableCell>
      </TableRow>
      {params.length > 0 && (
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={4} className="pt-0 whitespace-normal">
            <ProcedureArgumentsForm
              idPrefix={`${idPrefix}-${name}`}
              params={params}
              value={args}
              onChange={setArgs}
              simulatedAccounts={simulatedAccounts}
              simulatedAssets={simulatedAssets}
              sandboxDisabledReason={sandboxReason}
              disabled={disabled || reason !== undefined || running}
            />
          </TableCell>
        </TableRow>
      )}
    </>
  );
};

type ProceduresListProps = {
  // Makes the argument fields' ids unique on the page.
  idPrefix: string;
  procedureExports: ProcedureExport[];
  // Blocks every Invoke button: nothing to run against yet.
  disabled?: boolean;
  // Why a procedure can't run, if it can't: its Invoke button is disabled
  // and the reason shows under its name.
  blockedReason?: (procedureExport: ProcedureExport) => string | undefined;
  // Accounts the caller stages, offered to the `AccountId` arguments above
  // the sandbox's accounts (ProcedureArgumentsForm).
  simulatedAccounts?: { value: string; name: string }[];
  // Assets the caller issues, offered to the `Asset` arguments, and their
  // faucets to the `AccountId` ones, above the sandbox's.
  simulatedAssets?: { value: string; name: string }[];
  // Why a procedure's `AccountId` arguments can't take a sandbox account, if
  // they can't: the sandbox's accounts are listed disabled, with the reason,
  // and one picked before is cleared.
  sandboxDisabledReason?: (
    procedureExport: ProcedureExport,
  ) => string | undefined;
  // Runs the procedure with the form's arguments. The list shows what it
  // resolves to in the procedure's row.
  onInvoke: (
    procedureExport: ProcedureExport,
    args: ProcedureArguments,
  ) => Promise<ProcedureOutcome | undefined>;
};

// A component's procedures, each with the fields for its arguments and an
// Invoke button. What Invoke runs against (a simulated account, a deployed
// one) is the caller's: the list only collects arguments and shows outcomes.
const ProceduresList = ({
  idPrefix,
  procedureExports,
  disabled = false,
  blockedReason,
  simulatedAccounts,
  simulatedAssets,
  sandboxDisabledReason,
  onInvoke,
}: ProceduresListProps) => (
  <div className="rounded-md border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Procedure</TableHead>
          <TableHead className="max-sm:hidden">Signature</TableHead>
          <TableHead>Result</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {procedureExports.map((procedureExport) => (
          <ProcedureRows
            key={procedureExport.digest}
            idPrefix={idPrefix}
            procedureExport={procedureExport}
            disabled={disabled}
            blockedReason={blockedReason}
            simulatedAccounts={simulatedAccounts}
            simulatedAssets={simulatedAssets}
            sandboxDisabledReason={sandboxDisabledReason}
            onInvoke={onInvoke}
          />
        ))}
      </TableBody>
    </Table>
  </div>
);

export default ProceduresList;
