import { accountToTableAccount, type Account } from "@/lib/types";
import AccountInformationTable from "@/components/account/account-information-table";
import AccountStorageTable from "@/components/account/account-storage-table";
import FungibleAssetsTable from "@/components/lib/fungible-assets-table";
import AccountNotesTable from "@/components/account/account-notes-table";
import { Separator } from "@workspace/ui/components/separator";

const AccountInformation = ({ account }: { account: Account }) => {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
          Account Information
        </h4>
        <AccountInformationTable account={accountToTableAccount(account)} />
      </div>
      <div className="flex flex-col gap-2">
        <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
          Assets
        </h4>
        <FungibleAssetsTable
          fungibleAssets={account.account
            .vault()
            .fungibleAssets()
            .map((fungibleAsset) => ({
              faucetId: fungibleAsset.faucetId().toString(),
              amount: fungibleAsset.amount().toString(),
            }))}
        />
      </div>
      <div className="flex flex-col gap-2">
        <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
          Storage
        </h4>
        <AccountStorageTable storage={account.account.storage()} />
      </div>
      {account.consumableNoteIds.length > 0 && (
        <>
          <Separator />
          <div className="flex flex-col gap-2">
            <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
              Consumable Notes
            </h4>
            <AccountNotesTable account={account} />
          </div>
        </>
      )}
    </div>
  );
};

export default AccountInformation;
