import { Plus } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import useComponents from "@/hooks/use-components";

const CreateStorageSlotButton = ({ componentId }: { componentId: string }) => {
  const { openUpsertStorageSlotDialog } = useComponents();
  return (
    <Button
      variant="outline"
      onClick={() =>
        openUpsertStorageSlotDialog({ componentId, storageSlotIndex: -1 })
      }
    >
      <Plus />
      <span className="hidden lg:inline">Add storage slot</span>
    </Button>
  );
};

export default CreateStorageSlotButton;
