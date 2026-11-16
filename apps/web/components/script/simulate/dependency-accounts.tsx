import StorageSlotsEditor from "@/components/procedures/storage-slots-editor";
import type {
  DependencyAccount,
  UnresolvedDependency,
} from "@/hooks/use-dependency-accounts";
import type { StorageSlot } from "@/lib/types/component";
import { storageSlotDescriptions } from "@/lib/utils/storage-schema";
import { storageSlotsValid } from "@/lib/utils/storage-slots";

export const slotNamePlaceholder = (name: string) =>
  `${name.replace(/[^A-Za-z0-9_]/g, "_")}::component::field`;

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
// on an unresolved dependency.
const DependencyAccounts = ({
  title,
  labelPrefix,
  stale,
  missing,
  accounts,
  unresolved,
}: {
  title: string;
  labelPrefix: string;
  stale: string;
  missing: string;
  accounts: DependencyAccount[];
  unresolved: UnresolvedDependency[];
}) => (
  <div className="flex flex-col gap-2">
    <h3 className="text-xs font-medium">{title}</h3>
    {accounts.map(({ name, storageSlots, setStorageSlots, schema }) => (
      <section
        key={name}
        aria-label={`${labelPrefix} ${name}`}
        className="flex flex-col gap-2"
      >
        <h4 className="font-mono text-xs break-all text-muted-foreground">
          {name}
        </h4>
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
