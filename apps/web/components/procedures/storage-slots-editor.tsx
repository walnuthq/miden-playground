import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import {
  type StorageSlot,
  type StorageSlotType,
  storageSlotTypes,
} from "@/lib/types/component";
import { keyValuesToString, stringToKeyValues } from "@/lib/utils/component";
import { isWordText } from "@/lib/utils/storage-slots";

const slotTypeItems = Object.entries(storageSlotTypes).map(
  ([value, label]) => ({ value, label }),
);

const WORD_PLACEHOLDER = "Felt or 0x word";

// A felt or a word, flagged while it is neither. Empty reads as zero.
const WordInput = ({
  label,
  placeholder = WORD_PLACEHOLDER,
  value,
  disabled,
  onChange,
}: {
  label: string;
  placeholder?: string;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) => (
  <Input
    aria-label={label}
    className="h-8 min-w-0 flex-1 font-mono"
    placeholder={placeholder}
    value={value}
    aria-invalid={!isWordText(value)}
    disabled={disabled}
    onChange={(event) => onChange(event.target.value)}
  />
);

const MapEntries = ({
  storageSlot,
  disabled,
  onChange,
}: {
  storageSlot: StorageSlot;
  disabled: boolean;
  onChange: (value: string) => void;
}) => {
  const entries = stringToKeyValues(storageSlot.value);
  const replace = (index: number, entry?: { key: string; value: string }) =>
    onChange(
      keyValuesToString([
        ...entries.slice(0, index),
        ...(entry ? [entry] : []),
        ...entries.slice(index + 1),
      ]),
    );
  return (
    <div className="flex flex-col gap-1.5">
      {entries.map((entry, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: rows have no stable id, only their position.
        <div key={index} className="flex items-center gap-1.5">
          <WordInput
            label={`${storageSlot.name} key ${index + 1}`}
            placeholder="Key"
            value={entry.key}
            disabled={disabled}
            onChange={(key) => replace(index, { ...entry, key })}
          />
          <WordInput
            label={`${storageSlot.name} value ${index + 1}`}
            placeholder="Value"
            value={entry.value}
            disabled={disabled}
            onChange={(value) => replace(index, { ...entry, value })}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Remove entry ${index + 1} of ${storageSlot.name}`}
            disabled={disabled}
            onClick={() => replace(index)}
          >
            <Trash2 />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="self-start"
        disabled={disabled}
        onClick={() =>
          onChange(keyValuesToString([...entries, { key: "", value: "0" }]))
        }
      >
        <Plus />
        Add entry
      </Button>
    </div>
  );
};

// An account component's storage slots, their values edited in place: a felt
// or a word for a value slot, key/value entries for a map. `allowSlotEdits`
// adds and removes slots, for a component whose slots aren't known. It holds
// only the "new slot" row's state: the slots are the caller's.
const StorageSlotsEditor = ({
  storageSlots,
  onChange,
  disabled = false,
  allowSlotEdits = false,
  namePlaceholder = "package::component::field",
}: {
  storageSlots: StorageSlot[];
  onChange: (storageSlots: StorageSlot[]) => void;
  disabled?: boolean;
  allowSlotEdits?: boolean;
  namePlaceholder?: string;
}) => {
  const [name, setName] = useState("");
  const [type, setType] = useState<StorageSlotType>("value");
  const setValue = (index: number, value: string) =>
    onChange(
      storageSlots.map((storageSlot, slotIndex) =>
        slotIndex === index ? { ...storageSlot, value } : storageSlot,
      ),
    );
  const taken = storageSlots.some((storageSlot) => storageSlot.name === name);
  return (
    <div className="divide-y rounded-md border text-sm">
      {storageSlots.length === 0 && !allowSlotEdits && (
        <p className="p-2 text-muted-foreground">
          This component has no storage slots.
        </p>
      )}
      {/* A slot's name above its value: names are long, and the editor also
          shows in narrow columns and on phones. */}
      {storageSlots.map((storageSlot, index) => (
        <div key={storageSlot.name} className="flex flex-col gap-2 p-2">
          <div className="flex items-center gap-2">
            <span className="min-w-0 break-all font-mono text-xs">
              {storageSlot.name}
            </span>
            <Badge variant="outline">
              {storageSlotTypes[storageSlot.type]}
            </Badge>
            {allowSlotEdits && (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="ml-auto shrink-0"
                aria-label={`Remove slot ${storageSlot.name}`}
                disabled={disabled}
                onClick={() =>
                  onChange(
                    storageSlots.filter((_, slotIndex) => slotIndex !== index),
                  )
                }
              >
                <Trash2 />
              </Button>
            )}
          </div>
          {storageSlot.type === "value" ? (
            <WordInput
              label={`${storageSlot.name} value`}
              value={storageSlot.value}
              disabled={disabled}
              onChange={(value) => setValue(index, value)}
            />
          ) : (
            <MapEntries
              storageSlot={storageSlot}
              disabled={disabled}
              onChange={(value) => setValue(index, value)}
            />
          )}
        </div>
      ))}
      {allowSlotEdits && (
        <form
          className="flex flex-wrap items-center gap-1.5 p-2"
          onSubmit={(event) => {
            event.preventDefault();
            onChange([
              ...storageSlots,
              { name: name.trim(), type, value: type === "value" ? "0" : "" },
            ]);
            setName("");
          }}
        >
          <Input
            aria-label="New slot name"
            className="h-8 min-w-40 flex-1 font-mono"
            placeholder={namePlaceholder}
            value={name}
            disabled={disabled}
            onChange={(event) => setName(event.target.value)}
          />
          <Select
            items={slotTypeItems}
            value={type}
            onValueChange={(value) =>
              value && setType(value as StorageSlotType)
            }
          >
            <SelectTrigger
              size="sm"
              aria-label="New slot type"
              disabled={disabled}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {slotTypeItems.map(({ value, label }) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="submit"
            variant="secondary"
            size="sm"
            disabled={disabled || name.trim() === "" || taken}
          >
            <Plus />
            Add slot
          </Button>
        </form>
      )}
    </div>
  );
};

export default StorageSlotsEditor;
