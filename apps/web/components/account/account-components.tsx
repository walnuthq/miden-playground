import { Puzzle } from "lucide-react";
import { type Account } from "@/lib/types/account";
import { type Script, defaultScript } from "@/lib/types/script";
import AccountComponentTable from "@/components/account/account-component-table";
import useAccounts from "@/hooks/use-accounts";
import useScripts from "@/hooks/use-scripts";
import useComponents from "@/hooks/use-components";
import { Button } from "@workspace/ui/components/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty";
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
  const isEmpty =
    accountComponents.length === 0 && verifiedComponents.length === 0;
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-8">
        {isEmpty && (
          <Empty className="border border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Puzzle />
              </EmptyMedia>
              <EmptyTitle>This acount has no verified components</EmptyTitle>
              <EmptyDescription>
                Verify components by uploading their source code.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button
                size="sm"
                onClick={() => openVerifyAccountComponentDialog(account.id)}
              >
                Verify account component
              </Button>
            </EmptyContent>
          </Empty>
        )}
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
                // storageSlots: [], TODO
                storageSlots: [
                  { name: "count_map", type: "map", value: "1:0" },
                ],
                updatedAt: script.updatedAt,
              }}
              script={script}
            />
          </div>
        ))}
      </div>
      {!isEmpty && (
        <Button onClick={() => openVerifyAccountComponentDialog(account.id)}>
          Verify account component
        </Button>
      )}
    </div>
  );
};

export default AccountComponents;
