import { FolderDown } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import useScripts from "@/hooks/use-scripts";

const ImportProjectButton = () => {
  const { openImportProjectDialog } = useScripts();
  return (
    <Button variant="outline" onClick={openImportProjectDialog}>
      <FolderDown />
      <span className="hidden lg:inline">Import Project</span>
    </Button>
  );
};

export default ImportProjectButton;
