import { type Account } from "@/lib/types/account";
import AccountComponentTable from "@/components/account/account-component-table";
import useAccounts from "@/hooks/use-accounts";
import useComponents from "@/hooks/use-components";
import { Button } from "@workspace/ui/components/button";

const AccountComponents = ({ account }: { account: Account }) => {
  const { openVerifyAccountComponentDialog } = useAccounts();
  const { components } = useComponents();
  const accountComponents = account.components
    .map((componentId) => components.find(({ id }) => id === componentId))
    .filter((component) => component !== undefined);
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-8">
        {accountComponents.map((component) => (
          <div key={component.id} className="flex flex-col gap-2">
            <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
              {component.name}
            </h4>
            <AccountComponentTable account={account} component={component} />
          </div>
        ))}
      </div>
      <Button onClick={() => openVerifyAccountComponentDialog(account.id)}>
        Verify account component
      </Button>
    </div>
  );
};

export default AccountComponents;
