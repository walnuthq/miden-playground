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
import { getAddressPart } from "@/lib/utils";
import useMidenSdk from "@/hooks/use-miden-sdk";
import { addressToAccountId } from "@/lib/web-client";

const SelectAccountCombobox = ({
  onValueChange,
}: {
  onValueChange: Dispatch<SetStateAction<string>>;
}) => {
  const { midenSdk } = useMidenSdk();
  const { connectedWallet, wallets } = useAccounts();
  const [value, setValue] = useState("");
  const items = wallets
    .filter(({ id }) => id !== connectedWallet?.id)
    .map((wallet) => getAddressPart(wallet.address));
  if (value !== "" && !items.includes(value)) {
    items.unshift(value);
  }
  return (
    <Combobox
      value={value}
      items={items}
      onInputValueChange={(inputValue) => {
        setValue(getAddressPart(inputValue));
        const wallet = wallets.find(({ address }) => address === inputValue);
        if (wallet) {
          onValueChange(wallet.id);
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
      <ComboboxInput placeholder="Select a wallet" />
      <ComboboxContent>
        <ComboboxEmpty>No wallets found.</ComboboxEmpty>
        <ComboboxList>
          {(item: string) => {
            const wallet = wallets.find(
              ({ address }) => getAddressPart(address) === item,
            ) ?? {
              id: "0x000000000000000000000000000000",
              address: value,
              name: "Custom Wallet",
            };
            return (
              <ComboboxItem
                key={wallet.id}
                value={getAddressPart(wallet.address)}
              >
                {wallet.name} ({getAddressPart(wallet.address)})
              </ComboboxItem>
            );
          }}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
};

export default SelectAccountCombobox;
