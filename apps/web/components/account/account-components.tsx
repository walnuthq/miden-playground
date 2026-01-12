import { type Account } from "@/lib/types/account";
import { type Script, defaultScript } from "@/lib/types/script";
import AccountComponentTable from "@/components/account/account-component-table";
import useAccounts from "@/hooks/use-accounts";
import useScripts from "@/hooks/use-scripts";
import useComponents from "@/hooks/use-components";
import { Button } from "@workspace/ui/components/button";
import { defaultComponent } from "@/lib/types/component";

const AccountComponents = ({
  account,
  verifiedAccountComponents,
}: {
  account: Account;
  verifiedAccountComponents: Script[];
}) => {
  const { openVerifyAccountComponentDialog } = useAccounts();
  const { scripts } = useScripts();
  const { components } = useComponents();
  const accountComponents = account.components
    .map((componentId) => components.find(({ id }) => id === componentId))
    .filter((component) => component !== undefined)
    .map((component) => ({
      component,
      script:
        scripts.find(({ id }) => id === component.scriptId) ?? defaultScript(),
    }));
  const accountComponentsScriptsDigests = accountComponents.map(
    ({ script }) => script.digest
  );
  const verifiedComponents = verifiedAccountComponents.filter(
    ({ digest }) => !accountComponentsScriptsDigests.includes(digest)
  );
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-8">
        {accountComponents.map(({ component, script }) => (
          <div key={component.id} className="flex flex-col gap-2">
            <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
              {component.name}
            </h4>
            <AccountComponentTable
              account={account}
              component={component}
              script={script}
            />
          </div>
        ))}
        {verifiedComponents.map((script) => (
          <div key={script.id} className="flex flex-col gap-2">
            <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
              {script.name}
            </h4>
            <AccountComponentTable
              account={account}
              component={{
                ...defaultComponent(),
                id: script.id,
                name: script.name,
                type:
                  script.type === "account"
                    ? "account"
                    : "authentication-component",
                scriptId: script.id,
                storageSlots: [],
                updatedAt: script.updatedAt,
              }}
              script={script}
            />
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
