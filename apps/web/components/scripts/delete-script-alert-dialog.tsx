import { useState } from "react";
import { Spinner } from "@workspace/ui/components/spinner";
import { toast } from "sonner";
import useScripts from "@/hooks/use-scripts";
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

const DeleteScriptAlertDialog = () => {
  const {
    scripts,
    deleteScriptAlertDialogOpen,
    deleteScriptAlertDialogScriptId,
    closeDeleteScriptAlertDialog,
    deleteScript,
  } = useScripts();
  const [loading, setLoading] = useState(false);
  return (
    <AlertDialog
      open={deleteScriptAlertDialogOpen}
      onOpenChange={(open) => !open && closeDeleteScriptAlertDialog()}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your
            script.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={loading}
            onClick={async () => {
              setLoading(true);
              const { script, error } = await deleteScript(
                deleteScriptAlertDialogScriptId,
              );
              setLoading(false);
              if (script) {
                const deletedScript = scripts.find(
                  ({ id }) => id === script.id,
                );
                toast(`${deletedScript?.name} has been deleted.`);
              } else {
                toast.error("Error deleting script.", { description: error });
              }
            }}
          >
            {loading && <Spinner />}
            {loading ? "Deleting…" : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteScriptAlertDialog;
