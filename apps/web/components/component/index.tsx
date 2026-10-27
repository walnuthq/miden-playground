import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import { useLocation, useNavigate, useSearchParams } from "react-router";
import ComponentInformation from "@/components/component/component-information";
import ComponentScript from "@/components/component/component-script";
import UpsertStorageSlotDialog from "@/components/component/upsert-storage-slot-dialog";
import useComponents from "@/hooks/use-components";

const Component = ({ id }: { id: string }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const {
    components,
    upsertStorageSlotDialogComponentId: componentId,
    upsertStorageSlotDialogStorageSlotName: storageSlotName,
  } = useComponents();
  const component = components.find((component) => component.id === id);
  if (!component) {
    return null;
  }
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <Tabs
        value={searchParams.get("tab") ?? "information"}
        onValueChange={(value) =>
          navigate(
            value === "information"
              ? pathname
              : `${pathname}?${new URLSearchParams({ tab: value })}`,
          )
        }
      >
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="information">Information</TabsTrigger>
            <TabsTrigger value="script">Script</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="information">
          <ComponentInformation component={component} />
        </TabsContent>
        <TabsContent value="script">
          <ComponentScript component={component} />
        </TabsContent>
      </Tabs>
      <UpsertStorageSlotDialog
        componentId={componentId}
        storageSlotName={storageSlotName}
      />
    </div>
  );
};

export default Component;
