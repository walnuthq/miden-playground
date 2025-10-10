"use client";
import { useState, type Dispatch, type SetStateAction } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { formatId } from "@/lib/utils";
import { cn } from "@workspace/ui/lib/utils";
import { Button } from "@workspace/ui/components/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@workspace/ui/components/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";
import {
  type ConsumableNoteRecord as WasmConsumableNoteRecord,
  type InputNoteRecord as WasmInputNoteRecord,
} from "@demox-labs/miden-sdk";
import useAccounts from "@/hooks/use-accounts";
import {
  decodeFungibleFaucetMetadata,
  type Account,
} from "@/lib/types/account";

const getConsumableNoteFields = (
  inputNoteRecord: WasmInputNoteRecord,
  faucets: Account[]
) => {
  const noteFungibleAssets = inputNoteRecord
    .details()
    .assets()
    .fungibleAssets()
    .map((fungibleAsset) => {
      const faucetId = fungibleAsset.faucetId().toString();
      const amount = fungibleAsset.amount().toString();
      const faucet = faucets.find(({ id }) => id === faucetId);
      const { tokenSymbol } = decodeFungibleFaucetMetadata(faucet);
      return `${amount} ${tokenSymbol}`;
    });
  const metadata = inputNoteRecord.metadata();
  const wasmNoteTypes = {
    1: "public",
    2: "private",
    3: "encrypted",
  } as const;
  return {
    noteId: inputNoteRecord.id().toString(),
    noteType: metadata ? wasmNoteTypes[metadata.noteType()] : "public",
    noteFungibleAssets,
  };
};

const getConsumableNoteValue = (
  inputNoteRecord: WasmInputNoteRecord,
  faucets: Account[]
) => {
  const { noteId, noteType, noteFungibleAssets } = getConsumableNoteFields(
    inputNoteRecord,
    faucets
  );
  return [noteId, noteType, noteFungibleAssets.join(",")].join(",");
};

const getConsumableNoteLabel = (
  inputNoteRecord: WasmInputNoteRecord,
  faucets: Account[]
) => {
  const { noteId, noteType, noteFungibleAssets } = getConsumableNoteFields(
    inputNoteRecord,
    faucets
  );
  return `${noteType} note ${
    noteFungibleAssets.length === 0
      ? ""
      : `with assets ${noteFungibleAssets.join(",")}`
  } (${formatId(noteId)})`;
};

const SelectConsumableNotesCombobox = ({
  value,
  onValueChange,
  consumableNotes,
}: {
  value: string[];
  onValueChange: Dispatch<SetStateAction<string[]>>;
  consumableNotes: WasmConsumableNoteRecord[];
}) => {
  const { faucets } = useAccounts();
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="justify-between"
        >
          {value.length === 0
            ? "Select consumable notes…"
            : `${value.length} note${value.length === 1 ? "" : "s"} selected`}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full min-w-96 p-0">
        <Command>
          <CommandInput
            placeholder="Search consumable notes…"
            className="h-9"
          />
          <CommandList>
            <CommandEmpty>No consumable notes found.</CommandEmpty>
            <CommandGroup>
              {consumableNotes.map((consumableNote) => (
                <CommandItem
                  key={consumableNote.inputNoteRecord().id().toString()}
                  value={getConsumableNoteValue(
                    consumableNote.inputNoteRecord(),
                    faucets
                  )}
                  onSelect={(currentValue) => {
                    const [currentNoteId] = currentValue.split(",") as [string];
                    const index = value.findIndex(
                      (noteId) => noteId === currentNoteId
                    );
                    const newValue =
                      index === -1
                        ? [...value, currentNoteId]
                        : [...value.slice(0, index), ...value.slice(index + 1)];
                    onValueChange(newValue);
                    setOpen(false);
                  }}
                >
                  {getConsumableNoteLabel(
                    consumableNote.inputNoteRecord(),
                    faucets
                  )}
                  <Check
                    className={cn(
                      "ml-auto",
                      value.includes(
                        consumableNote.inputNoteRecord().id().toString()
                      )
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default SelectConsumableNotesCombobox;
