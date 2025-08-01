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
  type InputNoteRecord,
  type ConsumableNoteRecord,
} from "@workspace/mock-web-client";
import useAccounts from "@/hooks/use-accounts";
import { type Account, noteType } from "@/lib/types";

const getConsumableNoteFields = (
  inputNote: InputNoteRecord,
  faucets: Account[],
) => {
  const noteFungibleAssets = inputNote
    .details()
    .assets()
    .fungibleAssets()
    .map((asset) => {
      const faucet = faucets.find(
        ({ id }) => id === asset.faucetId().toString(),
      );
      return `${asset.amount()}::${faucet?.tokenSymbol ?? "Unknown"}`;
    });
  return {
    noteId: inputNote.id().toString(),
    noteType: noteType(inputNote),
    noteFungibleAssets,
  };
};

const getConsumableNoteValue = (
  inputNote: InputNoteRecord,
  faucets: Account[],
) => {
  const { noteId, noteType, noteFungibleAssets } = getConsumableNoteFields(
    inputNote,
    faucets,
  );
  return [noteId, noteType, noteFungibleAssets.join(",")].join(",");
};

const getConsumableNoteLabel = (
  inputNote: InputNoteRecord,
  faucets: Account[],
) => {
  const { noteId, noteType, noteFungibleAssets } = getConsumableNoteFields(
    inputNote,
    faucets,
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
  consumableNotes: ConsumableNoteRecord[];
}) => {
  const [open, setOpen] = useState(false);
  const { faucets } = useAccounts();
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
                    faucets,
                  )}
                  onSelect={(currentValue) => {
                    const [currentNoteId] = currentValue.split(",") as [string];
                    const index = value.findIndex(
                      (noteId) => noteId === currentNoteId,
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
                    faucets,
                  )}
                  <Check
                    className={cn(
                      "ml-auto",
                      value.includes(
                        consumableNote.inputNoteRecord().id().toString(),
                      )
                        ? "opacity-100"
                        : "opacity-0",
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
