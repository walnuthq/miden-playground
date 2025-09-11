import { type Component } from "@/lib/types";
import ComponentInformationTable from "@/components/component/component-information-table";
import ComponentStorageSlotsTable from "@/components/component/component-storage-slots-table";
import CreateStorageSlotButton from "@/components/component/create-storage-slot-button";

const ComponentInformation = ({ component }: { component: Component }) => (
  <div className="flex flex-col gap-8">
    <div className="flex flex-col gap-2">
      <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
        Component Information
      </h4>
      <ComponentInformationTable component={component} />
    </div>
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
            Component Storage Slots
          </h4>
          {component.storageSlots.length === 0 && (
            <p className="text-muted-foreground text-sm">
              This component has no storage slots.
            </p>
          )}
        </div>
        <CreateStorageSlotButton componentId={component.id} />
      </div>
      {component.storageSlots.length > 0 && (
        <ComponentStorageSlotsTable component={component} />
      )}
    </div>
  </div>
);

export default ComponentInformation;
