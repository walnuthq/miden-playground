import { Plus, FileDown, FilePlus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { Button } from "@workspace/ui/components/button";
import useNotes from "@/hooks/use-notes";
import useGlobalContext from "@/components/global-context/hook";
import { useWallet } from "@demox-labs/miden-wallet-adapter";

const AddNoteDropdownMenu = () => {
  const { connected } = useWallet();
  const { networkId } = useGlobalContext();
  const { openImportNoteDialog, openCreateNoteDialog } = useNotes();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Plus />
          <span className="hidden lg:inline">Add note</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem disabled onClick={openImportNoteDialog}>
          <FileDown />
          Import note
        </DropdownMenuItem>
        {networkId === "mtst" && (
          <DropdownMenuItem
            disabled={!connected}
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
