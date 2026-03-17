import { type Account } from "@/lib/types/account";
import AccountMultisigInformationTable from "@/components/account/account-multisig-information-table";
import AccountMultisigProposalsTable from "@/components/account/account-multisig-proposals-table";
// import { Button } from "@workspace/ui/components/button";
// import useMultisig from "@/hooks/use-multisig";
// import useTransactions from "@/hooks/use-transactions";

const AccountMultisig = ({ account }: { account: Account }) => {
  // const { submittingTransaction } = useTransactions();
  // const { isMultisigSigner, syncMultisig } = useMultisig();
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
            Guardian Information
          </h4>
          {/*<Button
            variant="outline"
            disabled={!isMultisigSigner(account) || submittingTransaction}
            onClick={() => syncMultisig(account.id)}
          >
            Sync Multisig
          </Button>*/}
        </div>
        {account.multisig && (
          <AccountMultisigInformationTable multisig={account.multisig} />
        )}
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center">
          <div>
            <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
              Proposals
            </h4>
            {account.multisig && account.multisig.proposals.length === 0 && (
              <p className="text-muted-foreground text-sm">
                This guardian has no proposals.
              </p>
            )}
          </div>
        </div>
        {account.multisig && account.multisig.proposals.length > 0 && (
          <AccountMultisigProposalsTable account={account} />
        )}
      </div>
    </div>
  );
};

export default AccountMultisig;
