import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import type { Dispatch, SetStateAction } from "react";
import SelectAccountDropdownMenu from "@/components/transactions/select-account-dropdown-menu";
import {
  emptyProcedureArgument,
  type ProcedureArgument,
  type ProcedureArguments,
  type ProcedureParam,
  procedureArgumentError,
} from "@/lib/utils/procedure-inputs";

const placeholders = {
  Felt: "A felt, e.g. 42",
  Word: "A word: 0x and 64 hex digits",
} as const;

// The fields for a procedure's arguments, one per parameter, by type. It
// holds no state and knows nothing of what runs the procedure: the account
// page's Invoke dialog and the script page's Simulate tab can both use it.
const ProcedureArgumentsForm = ({
  idPrefix,
  params,
  value,
  onChange,
  disabled = false,
}: {
  // Makes the fields' ids unique on the page.
  idPrefix: string;
  params: ProcedureParam[];
  value: ProcedureArguments;
  onChange: (value: ProcedureArguments) => void;
  disabled?: boolean;
}) => (
  <div className="grid gap-3 sm:grid-cols-2">
    {params.map(({ name, type, rawType }) => {
      const id = `${idPrefix}-${name}`;
      if (!type) {
        return (
          <p key={name} className="text-sm text-muted-foreground sm:col-span-2">
            {name}: arguments of type <code>{rawType}</code> aren't supported
            yet.
          </p>
        );
      }
      const argument = value[name] ?? emptyProcedureArgument(type);
      const set = (next: ProcedureArgument) =>
        onChange({ ...value, [name]: next });
      // Flagged once something was typed: an untouched field isn't an error.
      const invalid =
        value[name] !== undefined &&
        procedureArgumentError(value[name]) !== undefined;
      // The dropdown takes a state setter.
      const setter =
        (
          apply: (id: string) => ProcedureArgument,
        ): Dispatch<SetStateAction<string>> =>
        (next) =>
          set(apply(typeof next === "function" ? next("") : next));
      return (
        <div key={name} className="grid gap-1.5">
          <Label htmlFor={id}>
            {name}
            <span className="font-normal text-muted-foreground">{type}</span>
          </Label>
          {(argument.type === "Felt" || argument.type === "Word") && (
            <Input
              id={id}
              className="font-mono"
              placeholder={placeholders[argument.type]}
              value={argument.value}
              aria-invalid={invalid}
              disabled={disabled}
              onChange={(event) =>
                set({ type: argument.type, value: event.target.value })
              }
            />
          )}
          {argument.type === "AccountId" && (
            <SelectAccountDropdownMenu
              value={argument.accountId}
              onValueChange={setter((accountId) => ({
                type: "AccountId",
                accountId,
              }))}
            />
          )}
          {argument.type === "Asset" && (
            <div className="flex gap-2">
              <SelectAccountDropdownMenu
                value={argument.faucetId}
                onValueChange={setter((faucetId) => ({
                  ...argument,
                  faucetId,
                }))}
                selectFaucets
                showFaucetsAsAssets
              />
              <Input
                id={id}
                className="font-mono"
                placeholder="Amount"
                inputMode="numeric"
                value={argument.amount}
                aria-invalid={invalid && argument.faucetId !== ""}
                disabled={disabled}
                onChange={(event) =>
                  set({ ...argument, amount: event.target.value })
                }
              />
            </div>
          )}
        </div>
      );
    })}
  </div>
);

export default ProcedureArgumentsForm;
