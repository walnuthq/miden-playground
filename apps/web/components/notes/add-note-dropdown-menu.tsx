import { Plus, FileDown, FilePlus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { Button } from "@workspace/ui/components/button";
import useNotes from "@/hooks/use-notes";
import useNetwork from "@/hooks/use-network";
import useAccounts from "@/hooks/use-accounts";
import useScripts from "@/hooks/use-scripts";
import { defaultScriptIds } from "@/lib/types/default-scripts";

const AddNoteDropdownMenu = () => {
  const { networkId } = useNetwork();
  const { connectedWallet } = useAccounts();
  const { openImportNoteDialog, openCreateNoteDialog } = useNotes();
  const { scripts } = useScripts();
  const noteScripts = scripts.filter(
    ({ id, type }) => type === "note" && !defaultScriptIds.includes(id),
  );
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Plus />
          <span className="hidden lg:inline">Add note</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={openImportNoteDialog}>
          <FileDown />
          Import note
        </DropdownMenuItem>
        {networkId !== "mmck" && (
          <DropdownMenuItem
            disabled={!connectedWallet || noteScripts.length === 0}
            onClick={openCreateNoteDialog}
          >
            <FilePlus />
            Create note
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AddNoteDropdownMenu;
