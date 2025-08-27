import { Plus } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import useScripts from "@/hooks/use-scripts";

const CreateScriptButton = () => {
  const { openCreateScriptDialog } = useScripts();
  return (
    <Button variant="outline" onClick={openCreateScriptDialog}>
      <Plus />
      <span className="hidden lg:inline">Create new script</span>
    </Button>
  );
};

export default CreateScriptButton;
