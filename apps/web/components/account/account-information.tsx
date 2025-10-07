import { type Account } from "@/lib/types/account";
import AccountInformationTable from "@/components/account/account-information-table";
// import AccountStorageTable from "@/components/account/account-storage-table";
import FungibleAssetsTable from "@/components/lib/fungible-assets-table";
import AccountNotesTable from "@/components/account/account-notes-table";
import { Separator } from "@workspace/ui/components/separator";
import { Button } from "@workspace/ui/components/button";
import useTransactions from "@/hooks/use-transactions";
import useGlobalContext from "@/components/global-context/hook";

const AccountInformation = ({ account }: { account: Account }) => {
  const { networkId } = useGlobalContext();
  const { openCreateTransactionDialog, newConsumeTransactionRequest } =
    useTransactions();
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
          Account Information
        </h4>
        <AccountInformationTable account={account} />
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center">
          <div>
            <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
              Assets
            </h4>
            {account.fungibleAssets.length === 0 && (
              <p className="text-muted-foreground text-sm">
                This account has no assets.
              </p>
            )}
          </div>
        </div>
        {account.fungibleAssets.length > 0 && (
          <FungibleAssetsTable fungibleAssets={account.fungibleAssets} />
        )}
      </div>
      {/* <div className="flex flex-col gap-2">
        <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
          Storage
        </h4>
        <AccountStorageTable storage={account.storage} />
      </div> */}
      {account.consumableNoteIds.length > 0 && (
        <>
          <Separator />
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
                  Consumable Notes
                </h4>
                <p className="text-muted-foreground text-sm">
                  This account has pending notes that can be consumed.
                </p>
              </div>
              {networkId === "mlcl" && (
                <Button
                  variant="outline"
                  onClick={async () => {
                    const transactionResult =
                      await newConsumeTransactionRequest({
                        accountId: account.id,
                        noteIds: account.consumableNoteIds,
                      });
                    openCreateTransactionDialog({
                      accountId: account.id,
                      transactionType: "consume",
                      step: "preview",
                      transactionResult,
                    });
                  }}
                >
                  Consume all notes
                </Button>
              )}
            </div>
            <AccountNotesTable account={account} />
          </div>
        </>
      )}
    </div>
  );
};

export default AccountInformation;
