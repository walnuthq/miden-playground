import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Switch } from "@workspace/ui/components/switch";
import { cn } from "@workspace/ui/lib/utils";
import { Plus, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import ProcedureArgumentsForm from "@/components/procedures/procedure-arguments-form";
import type { NoteStorageSchema } from "@/lib/types/script";
import { noteStorageArgumentError } from "@/lib/utils/note-storage";
import {
  isFelt,
  type ProcedureArguments,
  type ProcedureParam,
} from "@/lib/utils/procedure-inputs";

// A note's storage: one typed field per field of the note's storage schema
// when `params` is given (`noteStorageParams`), raw felts otherwise, with the
// schema's fields listed as a hint when there is one. It holds no state and
// knows nothing of what the note is for: the script page's Simulate tab and
// the Create Note dialog both use it, so the two can't drift apart.
const NoteStorageFields = ({
  idPrefix,
  schema,
  params,
  args,
  onArgsChange,
  felts,
  onFeltsChange,
  raw = false,
  onRawChange,
  simulatedAccounts,
  simulatedAssets,
  rawNote,
  className,
  typedClassName,
}: {
  // Makes the fields' ids unique on the page.
  idPrefix: string;
  // The package's note storage schema, for the raw felts' hint.
  schema?: NoteStorageSchema;
  // The typed fields, or nothing for raw felts.
  params?: ProcedureParam[];
  args: ProcedureArguments;
  onArgsChange: (args: ProcedureArguments) => void;
  felts: string[];
  onFeltsChange: (felts: string[]) => void;
  // Raw felts chosen over the typed fields, with the switch that chooses:
  // shown when both are given and the fields can be typed.
  raw?: boolean;
  onRawChange?: (raw: boolean) => void;
  // Offered to the typed account fields above the sandbox's accounts.
  simulatedAccounts?: { value: string; name: string }[];
  simulatedAssets?: { value: string; name: string }[];
  // A line under the raw felts' hint.
  rawNote?: ReactNode;
  className?: string;
  // Added to `className` when the fields are typed.
  typedClassName?: string;
}) => {
  const typed = params !== undefined && !raw;
  const rawSwitchId = `${idPrefix}-raw`;
  // Flagged once something was typed: an untouched field isn't an error.
  const errors = typed
    ? params.flatMap((param) => {
        const error =
          args[param.name] !== undefined
            ? noteStorageArgumentError(param, args)
            : undefined;
        return error ? [`${param.name}: ${error}`] : [];
      })
    : [];
  return (
    <div
      className={cn(
        "grid content-start gap-1.5",
        className,
        typed && typedClassName,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <Label>Note storage</Label>
        {params !== undefined && params.length > 0 && onRawChange && (
          <div className="flex items-center gap-2">
            <Switch
              id={rawSwitchId}
              checked={raw}
              onCheckedChange={(checked) => onRawChange(checked)}
            />
            <Label htmlFor={rawSwitchId} className="font-normal">
              Enter as raw felts
            </Label>
          </div>
        )}
      </div>
      {typed ? (
        params.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            This note has no storage.
          </p>
        ) : (
          <>
            <ProcedureArgumentsForm
              idPrefix={`${idPrefix}-note`}
              params={params}
              value={args}
              onChange={onArgsChange}
              simulatedAccounts={simulatedAccounts}
              simulatedAssets={simulatedAssets}
            />
            {errors.map((error) => (
              <p key={error} className="text-xs text-destructive">
                {error}
              </p>
            ))}
          </>
        )
      ) : (
        <>
          {schema && (
            <p className="text-xs text-muted-foreground">
              Felts, in the order of the note's fields:{" "}
              {schema.fields
                .map(
                  ({ name, type, width }) =>
                    `${name} (${type}${width === undefined ? "" : `, ${width} felt${width === 1 ? "" : "s"}`})`,
                )
                .join(", ")}
              .
            </p>
          )}
          {rawNote && (
            <p className="text-xs text-muted-foreground">{rawNote}</p>
          )}
          {felts.map((item, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: rows have no stable id, only their position.
            <div key={index} className="flex items-center gap-1.5">
              <Input
                aria-label={`Note storage item ${index + 1}`}
                className="font-mono"
                placeholder="Felt"
                value={item}
                aria-invalid={!isFelt(item)}
                onChange={(event) =>
                  onFeltsChange(felts.with(index, event.target.value))
                }
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Remove note storage item ${index + 1}`}
                onClick={() => onFeltsChange(felts.toSpliced(index, 1))}
              >
                <Trash2 />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="justify-self-start"
            onClick={() => onFeltsChange([...felts, ""])}
          >
            <Plus />
            Add note storage
          </Button>
        </>
      )}
    </div>
  );
};

export default NoteStorageFields;
