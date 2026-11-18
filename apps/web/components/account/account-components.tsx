import { Button } from "@workspace/ui/components/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty";
import { Puzzle } from "lucide-react";
import AccountComponentTable from "@/components/account/account-component-table";
import useAccounts from "@/hooks/use-accounts";
import useScripts from "@/hooks/use-scripts";
import type { Account } from "@/lib/types/account";
import type { Script } from "@/lib/types/script";
import { isBuiltInScript } from "@/lib/utils/account-components";

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

// The account's components: the scripts `account.components` names, then
// the packages the registry verified for its code that aren't among them
// (by commitment).
const AccountComponents = ({
  account,
  verifiedAccountComponents,
}: {
  account: Account;
  verifiedAccountComponents: Script[];
}) => {
  const { scripts } = useScripts();
  const accountScripts = account.components.flatMap((scriptId) =>
    scripts.filter(({ id }) => id === scriptId),
  );
  const commitments = accountScripts.map(({ commitment }) => commitment);
  const componentScripts = [
    ...accountScripts,
    ...verifiedAccountComponents.filter(
      ({ commitment }) => !commitments.includes(commitment),
    ),
  ];
  const authenticationComponents = componentScripts.filter(
    ({ type }) => type === "authentication-component",
  );
  // Every account has the basic wallet component, so list it after the others.
  const accountComponents = componentScripts
    .filter(({ type }) => type === "account-component")
    .toSorted(
      (a, b) =>
        Number(a.id === "basic-wallet") - Number(b.id === "basic-wallet"),
    );
  const customAccountComponents = accountComponents.filter(
    (script) => !isBuiltInScript(script),
  );
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
            Account Components
          </h4>
          {accountComponents.map((script) => (
            <AccountComponentTable
              key={script.id}
              account={account}
              script={script}
            />
          ))}
          <AddCustomComponents
            empty={customAccountComponents.length === 0}
            type="account-component"
            accountId={account.id}
          />
        </div>
        <div className="flex flex-col gap-2">
          <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
            Authentication Components
          </h4>
          {authenticationComponents.map((script) => (
            <AccountComponentTable
              key={script.id}
              account={account}
              script={script}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default AccountComponents;
