import { Button } from "@workspace/ui/components/button";
import { Plus } from "lucide-react";
import useComponents from "@/hooks/use-components";

const CreateStorageSlotButton = ({ componentId }: { componentId: string }) => {
  const { openUpsertStorageSlotDialog } = useComponents();
  return (
    <Button
      variant="outline"
      onClick={() =>
        openUpsertStorageSlotDialog({ componentId, storageSlotName: "" })
      }
    >
      <Plus />
      <span className="sr-only lg:not-sr-only">Add storage slot</span>
    </Button>
  );
};

export default CreateStorageSlotButton;
