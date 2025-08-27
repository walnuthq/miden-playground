import { type Component } from "@/lib/types";
import AccountComponentTable from "@/components/account/account-component-table";

const AccountComponents = ({ components }: { components: Component[] }) => (
  <div className="flex flex-col gap-8">
    {components.map((component) => (
      <div key={component.id} className="flex flex-col gap-2">
        <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
          {component.name}
        </h4>
        <AccountComponentTable component={component} />
      </div>
    ))}
  </div>
);

export default AccountComponents;
