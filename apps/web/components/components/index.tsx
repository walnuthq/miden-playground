import { columns } from "@/components/components/columns";
import ComponentsTable from "@/components/components/components-table";
import CreateComponentDialog from "@/components/components/create-component-dialog";
import useComponents from "@/hooks/use-components";
import { defaultComponentIds } from "@/lib/types/default-components";

const Components = () => {
  const { components } = useComponents();
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <ComponentsTable
        columns={columns}
        data={components.filter(({ id }) => !defaultComponentIds.includes(id))}
      />
      <CreateComponentDialog />
    </div>
  );
};

export default Components;
