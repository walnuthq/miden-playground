import { Plus } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import useComponents from "@/hooks/use-components";

const CreateComponentButton = () => {
  const { openCreateComponentDialog } = useComponents();
  return (
    <Button variant="outline" onClick={openCreateComponentDialog}>
      <Plus />
      <span className="hidden lg:inline">Create new component</span>
    </Button>
  );
};

export default CreateComponentButton;
