"use client";
import { useIsClient } from "usehooks-ts";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import useComponents from "@/hooks/use-components";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import ComponentInformation from "@/components/component/component-information";
import ComponentScript from "@/components/component/component-script";
import UpsertStorageSlotDialog from "@/components/component/upsert-storage-slot-dialog";

const Component = ({ id }: { id: string }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isClient = useIsClient();
  const {
    components,
    upsertStorageSlotDialogComponentId: componentId,
    upsertStorageSlotDialogStorageSlotIndex: storageSlotIndex,
  } = useComponents();
  const component = components.find((component) => component.id === id);
  if (!isClient || !component) {
    return null;
  }
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <Tabs
        defaultValue={searchParams.get("tab") ?? "information"}
        onValueChange={(value) =>
          router.push(
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
        storageSlotIndex={storageSlotIndex}
      />
    </div>
  );
};

export default Component;
