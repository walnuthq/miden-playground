import { type Dispatch, type SetStateAction, useMemo } from "react";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "@workspace/ui/components/combobox";
import type { Script } from "@/lib/types/script";

const SelectScriptsCombobox = ({
  scripts,
  value,
  onValueChange,
  placeholder,
}: {
  scripts: Script[];
  value: string[];
  onValueChange: Dispatch<SetStateAction<string[]>>;
  placeholder: string;
}) => {
  const anchorRef = useComboboxAnchor();
  const scriptIds = useMemo(() => scripts.map(({ id }) => id), [scripts]);
  const scriptName = (scriptId: string) =>
    scripts.find(({ id }) => id === scriptId)?.name ?? scriptId;
  return (
    <Combobox
      items={scriptIds}
      value={value}
      onValueChange={onValueChange}
      multiple
      itemToStringLabel={scriptName}
    >
      <ComboboxChips ref={anchorRef}>
        <ComboboxValue>
          {(selectedIds: string[]) => (
            <>
              {selectedIds.map((scriptId) => (
                <ComboboxChip key={scriptId} aria-label={scriptName(scriptId)}>
                  {scriptName(scriptId)}
                </ComboboxChip>
              ))}
              <ComboboxChipsInput
                placeholder={selectedIds.length === 0 ? placeholder : undefined}
              />
            </>
          )}
        </ComboboxValue>
      </ComboboxChips>
      <ComboboxContent anchor={anchorRef}>
        <ComboboxEmpty>No scripts found.</ComboboxEmpty>
        <ComboboxList>
          {(scriptId: string) => (
            <ComboboxItem key={scriptId} value={scriptId}>
              {scriptName(scriptId)}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
};

export default SelectScriptsCombobox;
