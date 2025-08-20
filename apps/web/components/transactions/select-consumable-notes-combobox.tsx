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
import { type ConsumableNoteRecord } from "@workspace/mock-web-client";
import useAccounts from "@/hooks/use-accounts";
import {
  wasmInputNoteToInputNote,
  type Account,
  type InputNote,
} from "@/lib/types";
import useGlobalContext from "@/components/global-context/hook";

const getConsumableNoteFields = (inputNote: InputNote, faucets: Account[]) => {
  const noteFungibleAssets = inputNote.fungibleAssets.map(
    ({ faucetId, amount }) => {
      const faucet = faucets.find(({ id }) => id === faucetId);
      return `${amount} ${faucet?.tokenSymbol ?? "Unknown"}`;
    },
  );
  return {
    noteId: inputNote.id,
    noteType: inputNote.type,
    noteFungibleAssets,
  };
};

const getConsumableNoteValue = (inputNote: InputNote, faucets: Account[]) => {
  const { noteId, noteType, noteFungibleAssets } = getConsumableNoteFields(
    inputNote,
    faucets,
  );
  return [noteId, noteType, noteFungibleAssets.join(",")].join(",");
};

const getConsumableNoteLabel = (inputNote: InputNote, faucets: Account[]) => {
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
  const { networkId } = useGlobalContext();
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
                    wasmInputNoteToInputNote(
                      consumableNote.inputNoteRecord(),
                      networkId,
                    ),
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
                    wasmInputNoteToInputNote(
                      consumableNote.inputNoteRecord(),
                      networkId,
                    ),
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
