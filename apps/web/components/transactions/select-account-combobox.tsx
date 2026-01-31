import { useState, type Dispatch, type SetStateAction } from "react";
import useAccounts from "@/hooks/use-accounts";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@workspace/ui/components/combobox";
import { getIdentifierPart } from "@/lib/types/account";
import useMidenSdk from "@/hooks/use-miden-sdk";
import { addressToAccountId } from "@/lib/web-client";

const SelectAccountCombobox = ({
  onValueChange,
}: {
  onValueChange: Dispatch<SetStateAction<string>>;
}) => {
  const { midenSdk } = useMidenSdk();
  const { connectedWallet, accounts } = useAccounts();
  const [value, setValue] = useState("");
  const items = accounts
    .filter(({ id }) => id !== connectedWallet?.id)
    .map(({ identifier }) => identifier);
  if (value !== "" && !items.includes(value)) {
    items.unshift(value);
  }
  return (
    <Combobox
      value={value}
      items={items}
      onInputValueChange={(inputValue) => {
        setValue(getIdentifierPart(inputValue));
        const account = accounts.find(({ address }) => address === inputValue);
        if (account) {
          onValueChange(account.id);
          return;
        }
        try {
          const accountId = addressToAccountId({
            address: inputValue,
            midenSdk,
          });
          onValueChange(accountId.toString());
          return;
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
          //
        }
        onValueChange("");
      }}
    >
      <ComboboxInput placeholder="Select an account" />
      <ComboboxContent>
        <ComboboxEmpty>No accounts found.</ComboboxEmpty>
        <ComboboxList>
          {(item: string) => {
            const account = accounts.find(
              ({ identifier }) => identifier === item,
            ) ?? {
              id: "0x000000000000000000000000000000",
              identifier: value,
              name: "Custom Account",
            };
            return (
              <ComboboxItem key={account.id} value={account.identifier}>
                {account.identifier} ({account.name})
              </ComboboxItem>
            );
          }}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
};

export default SelectAccountCombobox;
