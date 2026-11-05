import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import useSavedProjects from "@/hooks/use-saved-projects";

// Confirms deleting the active project. Opened from the project switcher's
// menu, rendered outside it (see State.deleteProjectDialogOpen).
const DeleteProjectAlertDialog = () => {
  const {
    projectName,
    deleteProjectDialogOpen,
    closeDeleteProjectDialog,
    deleteActiveProject,
  } = useSavedProjects();
  // The name outlives the deletion, for the title while the dialog closes.
  const [name, setName] = useState(projectName);
  useEffect(() => {
    if (deleteProjectDialogOpen) {
      setName(projectName);
    }
  }, [deleteProjectDialogOpen, projectName]);
  const remove = async () => {
    // AlertDialogAction is a plain button, not a close trigger.
    closeDeleteProjectDialog();
    try {
      await deleteActiveProject();
      toast.success("Project deleted.", { description: name });
    } catch (error) {
      console.error("ERROR: deleteActiveProject", error);
      toast.error("The project couldn't be deleted.", {
        description: error instanceof Error ? error.message : String(error),
      });
    }
  };
  return (
    <AlertDialog
      open={deleteProjectDialogOpen}
      onOpenChange={(open) => !open && closeDeleteProjectDialog()}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {name}?</AlertDialogTitle>
          <AlertDialogDescription>
            Its saved accounts, notes, transactions, scripts and components are
            deleted. What's open stays as it is, unsaved.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={remove}>Delete project</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteProjectAlertDialog;
