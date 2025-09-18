import { ChevronsUpDown } from "lucide-react";
import { type Dispatch, type SetStateAction } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@workspace/ui/components/dropdown-menu";
import { Button } from "@workspace/ui/components/button";
import { type TransactionType } from "@/lib/types/transaction";

const SelectTransactionTypeDropdownMenu = ({
  value,
  onValueChange,
  selectTypes = ["consume", "send", "mint"],
}: {
  value: TransactionType;
  onValueChange: Dispatch<SetStateAction<TransactionType>>;
  selectTypes?: TransactionType[];
}) => {
  const transactionTypes = {
    mint: "Mint",
    consume: "Consume notes",
    send: "Send",
  } as const;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="justify-between" variant="secondary">
          {transactionTypes[value]}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="start">
        <DropdownMenuRadioGroup
          value={value}
          onValueChange={(newValue) =>
            onValueChange(newValue as TransactionType)
          }
        >
          {selectTypes.map((transactionType) => (
            <DropdownMenuRadioItem
              key={transactionType}
              value={transactionType}
            >
              {transactionTypes[transactionType]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default SelectTransactionTypeDropdownMenu;
