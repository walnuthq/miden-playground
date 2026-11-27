import type { Export, Manifest, ProcedureParameter } from "@/lib/types";

// What api-compile reads from a build next to its manifest, by export path:
// whether each export is read-only and whether it calls another account
// (`null` when it can't be told), and its parameters' names from the source.
// `callsForeign` and `parameters` are absent from an api-compile older than
// them; `parameters` lacks an export whose names weren't found.
export type ExportAnalysis = {
  readOnly: Record<string, boolean | null>;
  callsForeign?: Record<string, boolean | null>;
  parameters?: Record<string, ProcedureParameter[]>;
};

// The Component Model calling convention: what miden-assembly gives every
// procedure that declares a signature.
const COMPONENT_MODEL_ABI = 3;

// The manifest's procedure exports with what api-compile read of each, stored
// with the export in the `exports` column. A type the source exports isn't
// kept. A procedure that declares no signature (`pub proc add`, its stack
// effect in a comment) has a null one in the manifest: it's kept with an
// empty signature and `untyped`, so the web app's forms take its stack as raw
// felts instead of losing the procedure.
export const analyzedExports = (
  manifest: Manifest,
  { readOnly, callsForeign, parameters }: ExportAnalysis,
): Export[] =>
  manifest.exports
    .filter(
      (manifestExport): manifestExport is Export =>
        manifestExport.Procedure !== undefined &&
        (manifestExport.Procedure.signature === null ||
          manifestExport.Procedure.signature.abi === COMPONENT_MODEL_ABI),
    )
    .map(({ Procedure: procedureExport }) => ({
      Procedure: {
        ...procedureExport,
        ...(procedureExport.signature === null && {
          signature: { abi: COMPONENT_MODEL_ABI, params: [], results: [] },
          untyped: true,
        }),
        readOnly: readOnly[procedureExport.path],
        callsForeign: callsForeign?.[procedureExport.path],
        ...(parameters?.[procedureExport.path] && {
          parameters: parameters[procedureExport.path],
        }),
      },
    }));
