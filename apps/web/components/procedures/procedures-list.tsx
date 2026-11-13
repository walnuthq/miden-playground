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
  onInvoke,
}: {
  idPrefix: string;
  procedureExport: ProcedureExport;
  disabled: boolean;
  onInvoke: ProceduresListProps["onInvoke"];
}) => {
  const name = formatProcedureExportPath(procedureExport.path);
  const params = procedureParams(procedureExport);
  const [args, setArgs] = useState<ProcedureArguments>({});
  const [running, setRunning] = useState(false);
  const [outcome, setOutcome] = useState<ProcedureOutcome>();
  return (
    <>
      <TableRow className={params.length > 0 ? "border-b-0" : undefined}>
        <TableCell className="whitespace-normal">
          {/* The badge goes under the name on a phone. */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {name}
            {procedureExport.readOnly && (
              <Badge variant="outline">Read-only</Badge>
            )}
          </div>
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
              disabled || running || !procedureArgumentsReady(params, args)
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
              disabled={disabled || running}
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
            onInvoke={onInvoke}
          />
        ))}
      </TableBody>
    </Table>
  </div>
);

export default ProceduresList;
