import { Label } from "@workspace/ui/components/label";
import { Switch } from "@workspace/ui/components/switch";
import StorageSlotsEditor from "@/components/procedures/storage-slots-editor";
import type {
  DependencyAccount,
  UnresolvedDependency,
} from "@/hooks/use-dependency-accounts";
import type { StorageSlot } from "@/lib/types/storage-slot";
import { storageSlotDescriptions } from "@/lib/utils/storage-schema";
import {
  storageSlotPrefix,
  storageSlotsValid,
} from "@/lib/utils/storage-slots";

// A MASM slot's name as the templates give it, `<namespace>::<slot>`:
// `counter_account::count_map`.
export const slotNamePlaceholder = (name: string) =>
  `${storageSlotPrefix(name)}slot_name`;

export const InvalidSlots = () => (
  <p className="text-xs text-destructive">
    Storage values are felts or words (0x and 64 hex digits), with distinct slot
    names and map keys.
  </p>
);

// The storage of the accounts a simulation builds from the script's
// `account-component` dependencies, one editor per dependency, and the
// dependencies whose package wasn't found, with why. `labelPrefix` names each
// section (`${labelPrefix} ${name}`); `stale` and `missing` end the sentence
// on an unresolved dependency. With `foreign`, each account has a switch
// that makes it a foreign account (`foreign.labelPrefix` then names its
// section) instead of a component of the simulated account.
const DependencyAccounts = ({
  title,
  labelPrefix,
  stale,
  missing,
  accounts,
  unresolved,
  foreign,
}: {
  title: string;
  labelPrefix: string;
  stale: string;
  missing: string;
  accounts: DependencyAccount[];
  unresolved: UnresolvedDependency[];
  foreign?: {
    idPrefix: string;
    labelPrefix: string;
    names: string[];
    onChange: (name: string, foreign: boolean) => void;
  };
}) => (
  <div className="flex flex-col gap-2">
    <h3 className="text-xs font-medium">{title}</h3>
    {accounts.map(({ name, storageSlots, setStorageSlots, schema }) => (
      <section
        key={name}
        aria-label={`${
          foreign?.names.includes(name) ? foreign.labelPrefix : labelPrefix
        } ${name}`}
        className="flex flex-col gap-2"
      >
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <h4 className="font-mono text-xs break-all text-muted-foreground">
            {name}
          </h4>
          {foreign && (
            <div className="flex items-center gap-2">
              <Switch
                id={`${foreign.idPrefix}-foreign-${name}`}
                size="sm"
                checked={foreign.names.includes(name)}
                onCheckedChange={(checked) => foreign.onChange(name, checked)}
              />
              <Label
                htmlFor={`${foreign.idPrefix}-foreign-${name}`}
                className="text-xs font-normal"
              >
                Foreign account
              </Label>
            </div>
          )}
        </div>
        <StorageSlotsEditor
          storageSlots={storageSlots}
          onChange={(slots: StorageSlot[]) => setStorageSlots(slots)}
          allowSlotEdits={!schema}
          descriptions={schema && storageSlotDescriptions(schema)}
          namePlaceholder={slotNamePlaceholder(name)}
        />
        {!storageSlotsValid(storageSlots) && <InvalidSlots />}
      </section>
    ))}
    {unresolved.map(({ name, reason }) => (
      <p key={name} className="text-xs text-muted-foreground">
        <span className="font-mono break-all">{name}</span>:{" "}
        {reason === "stale" ? stale : missing}
      </p>
    ))}
  </div>
);

export default DependencyAccounts;
