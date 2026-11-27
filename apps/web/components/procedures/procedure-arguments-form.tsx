import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import type { Dispatch, SetStateAction } from "react";
import SelectAccountDropdownMenu from "@/components/transactions/select-account-dropdown-menu";
import {
  emptyFeltsArgument,
  emptyProcedureArgument,
  isFelt,
  type ProcedureArgument,
  type ProcedureArguments,
  type ProcedureParam,
  procedureArgumentError,
  stackFelts,
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
  simulatedAccounts,
  simulatedAssets,
  sandboxDisabledReason,
}: {
  // Makes the fields' ids unique on the page.
  idPrefix: string;
  params: ProcedureParam[];
  value: ProcedureArguments;
  onChange: (value: ProcedureArguments) => void;
  disabled?: boolean;
  // Accounts a simulation stages, offered to the `AccountId` fields above
  // the sandbox's accounts.
  simulatedAccounts?: { value: string; name: string }[];
  // Assets a simulation issues, offered to the `Asset` fields above the
  // sandbox's faucets, and their faucets to the `AccountId` fields.
  simulatedAssets?: { value: string; name: string }[];
  // When given, the `AccountId` fields list the sandbox's accounts disabled,
  // with this reason: only `simulatedAccounts` can be picked. The caller
  // clears a sandbox account picked before.
  sandboxDisabledReason?: string;
}) => {
  // A faucet's id is an account id: a simulated asset's faucet can be named.
  const simulatedIds = [
    ...(simulatedAccounts ?? []),
    ...(simulatedAssets ?? []).map(({ value, name }) => ({
      value,
      name: `${name} faucet`,
    })),
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {params.map(
        ({ name, type, rawType, label, feltCount, feltNames, max, stack }) => {
          const id = `${idPrefix}-${name}`;
          // A procedure that declares no signature: the stack it takes, as
          // felts of any number.
          if (stack) {
            const current = value[name];
            const text = current?.type === "Stack" ? current.value : "";
            const count = stackFelts(text).length;
            return (
              <div key={name} className="grid gap-1.5 sm:col-span-2">
                <Label htmlFor={id}>
                  {name}
                  <span className="font-normal text-muted-foreground">
                    {count} felt{count === 1 ? "" : "s"}, top first
                  </span>
                </Label>
                <Input
                  id={id}
                  className="font-mono"
                  placeholder="Felts, top of the stack first, e.g. 5 0 0 0"
                  value={text}
                  aria-invalid={
                    procedureArgumentError({ type: "Stack", value: text }) !==
                    undefined
                  }
                  disabled={disabled}
                  onChange={(event) =>
                    onChange({
                      ...value,
                      [name]: { type: "Stack", value: event.target.value },
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  This procedure declares no signature: enter the stack it
                  takes, separated by spaces or commas, or leave it empty.
                </p>
              </div>
            );
          }
          // A type the forms don't know, entered as the felts of its layout,
          // in field order.
          if (!type && feltCount !== undefined) {
            const current = value[name];
            const argument =
              current?.type === "Felts" && current.values.length === feltCount
                ? current
                : emptyFeltsArgument(feltCount);
            const values = argument.type === "Felts" ? argument.values : [];
            const single = feltCount === 1;
            return (
              <div
                key={name}
                // A group of felts takes the row: four of them fit a phone two
                // by two.
                className={
                  single ? "grid gap-1.5" : "grid gap-1.5 sm:col-span-2"
                }
                {...(!single && {
                  role: "group",
                  "aria-labelledby": `${id}-label`,
                })}
              >
                <Label id={`${id}-label`} htmlFor={single ? id : `${id}-0`}>
                  {name}
                  <span className="font-normal text-muted-foreground">
                    {rawType}, {feltCount} felt{single ? "" : "s"}
                  </span>
                </Label>
                <div
                  className={
                    single ? "grid" : "grid grid-cols-2 gap-2 sm:grid-cols-4"
                  }
                >
                  {values.map((felt, index) => (
                    <Input
                      // oxlint-disable-next-line react/no-array-index-key -- a felt is its position in the layout.
                      key={index}
                      id={single ? id : `${id}-${index}`}
                      aria-label={
                        single
                          ? undefined
                          : `${name} ${feltNames?.[index] ?? `felt ${index + 1}`}`
                      }
                      className="font-mono"
                      placeholder={
                        single
                          ? placeholders.Felt
                          : (feltNames?.[index] ?? placeholders.Felt)
                      }
                      value={felt}
                      // Flagged once typed in: an untouched felt isn't an error.
                      aria-invalid={felt !== "" && !isFelt(felt)}
                      disabled={disabled}
                      onChange={(event) =>
                        onChange({
                          ...value,
                          [name]: {
                            type: "Felts",
                            values: values.with(index, event.target.value),
                          },
                        })
                      }
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Entered as raw felts: the form doesn't know this type.
                </p>
              </div>
            );
          }
          if (!type) {
            return (
              <p
                key={name}
                className="text-sm text-muted-foreground sm:col-span-2"
              >
                {name}: arguments of type <code>{rawType}</code> aren't
                supported yet.
              </p>
            );
          }
          const argument = value[name] ?? emptyProcedureArgument(type);
          const set = (next: ProcedureArgument) =>
            onChange({ ...value, [name]: next });
          // Flagged once something was typed: an untouched field isn't an error.
          const invalid =
            value[name] !== undefined &&
            procedureArgumentError(value[name], max) !== undefined;
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
                <span className="font-normal text-muted-foreground">
                  {label ?? type}
                </span>
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
                  simulatedAccounts={simulatedIds}
                  sandboxDisabledReason={sandboxDisabledReason}
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
                    simulatedAccounts={simulatedAssets}
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
        },
      )}
    </div>
  );
};

export default ProcedureArgumentsForm;
