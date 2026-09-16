import { Puzzle } from "lucide-react";
import type { Account } from "@/lib/types/account";
import type { Script } from "@/lib/types/script";
import { defaultScript } from "@/lib/utils/script";
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
import type { ComponentType, StorageSlotType } from "@/lib/types/component";
import { defaultComponent, storageSlotName } from "@/lib/utils/component";
import useTutorials from "@/hooks/use-tutorials";
import { defaultComponentIds } from "@/lib/types/default-components";

const AddCustomComponents = ({
  empty,
  type,
  accountId,
}: {
  empty: boolean;
  type: "account-component" | "authentication-component";
  accountId: string;
}) => {
  const { openVerifyAccountComponentDialog } = useAccounts();
  const componentType =
    type === "account-component" ? "account" : "authentication";
  return (
    <Empty className="border border-dashed">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Puzzle />
        </EmptyMedia>
        <EmptyTitle>
          {empty
            ? `This account has no verified custom ${componentType} components`
            : `Add more verified custom ${componentType} components`}
        </EmptyTitle>
        <EmptyDescription>
          Verify {type === "account-component" ? "account" : "authentication"}{" "}
          components by uploading their source code.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button
          size="sm"
          onClick={() => openVerifyAccountComponentDialog(accountId)}
        >
          Verify account component
        </Button>
      </EmptyContent>
    </Empty>
  );
};

const AccountComponents = ({
  account,
  verifiedAccountComponents,
}: {
  account: Account;
  verifiedAccountComponents: Script[];
}) => {
  const { tutorialId } = useTutorials();
  const { scripts } = useScripts();
  const { components } = useComponents();
  const accountComponentsWithScripts = account.components
    .map((componentId) => components.find(({ id }) => id === componentId))
    .filter((component) => component !== undefined)
    .map((component) => ({
      component,
      script:
        scripts.find(({ id }) => id === component.scriptId) ?? defaultScript(),
    }));
  const accountComponentsScriptsDigests = accountComponentsWithScripts.map(
    ({ script }) => script.digest,
  );
  const verifiedAccountComponentsWithScripts = verifiedAccountComponents
    .filter(({ digest }) => !accountComponentsScriptsDigests.includes(digest))
    .map((script) => ({
      component: {
        ...defaultComponent(),
        id: script.id,
        name: script.name,
        type: (script.type === "account-component"
          ? "account-component"
          : "authentication-component") as ComponentType,
        scriptId: script.id,
        // storageSlots: [], // TODO
        storageSlots:
          tutorialId === "contract-verification"
            ? [
                {
                  name: storageSlotName({
                    packageName: script.name,
                    traitName: "CounterContract",
                    fieldName: "count_map",
                  }),
                  type: "map" as StorageSlotType,
                  value: "1:0",
                },
              ]
            : [], // TODO
        updatedAt: script.updatedAt,
      },
      script,
    }));
  const componentsWithScripts = [
    ...accountComponentsWithScripts,
    ...verifiedAccountComponentsWithScripts,
  ];
  const authenticationComponents = componentsWithScripts.filter(
    ({ component }) => component.type === "authentication-component",
  );
  const accountComponents = componentsWithScripts.filter(
    ({ component }) => component.type === "account-component",
  );
  const customAccountComponents = accountComponents.filter(
    ({ component }) => !defaultComponentIds.includes(component.id),
  );
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
            Authentication Components
          </h4>
          {authenticationComponents.map(({ component, script }) => (
            <AccountComponentTable
              key={component.id}
              account={account}
              component={component}
              script={script}
            />
          ))}
        </div>
        <div className="flex flex-col gap-2">
          <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
            Account Components
          </h4>
          {accountComponents.map(({ component, script }) => (
            <AccountComponentTable
              key={component.id}
              account={account}
              component={component}
              script={script}
            />
          ))}
          <AddCustomComponents
            empty={customAccountComponents.length === 0}
            type="account-component"
            accountId={account.id}
          />
        </div>
      </div>
    </div>
  );
};

export default AccountComponents;
