import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Spinner } from "@workspace/ui/components/spinner";
import { useState } from "react";
import { toast } from "sonner";
import { projectTitle } from "@/components/lib/project-switcher-view";
import useExamples from "@/hooks/use-examples";
import useNetwork from "@/hooks/use-network";
import useSavedProjects from "@/hooks/use-saved-projects";
import useTutorials from "@/hooks/use-tutorials";
import { formValue } from "@/lib/utils";

// Asks for a project's name, then saves the workspace under it. Opened from
// the project switcher's menu by Save as, and by Save when no project is
// active yet; rendered outside the switcher (see State.saveProjectDialogOpen).
const SaveProjectDialog = () => {
  const { networkId } = useNetwork();
  const { tutorialId } = useTutorials();
  const { exampleId } = useExamples();
  const {
    projectId,
    projectName,
    saveProjectDialogOpen,
    saveProjectDialogSaveAs,
    closeSaveProjectDialog,
    saveProjectAs,
  } = useSavedProjects();
  const [loading, setLoading] = useState(false);
  // A copy of the active project, else the workspace's title (the example's,
  // or "<Network> sandbox").
  const defaultName =
    saveProjectDialogSaveAs && projectId
      ? `${projectName} copy`
      : projectTitle({ projectName, tutorialId, exampleId, networkId });
  return (
    <Dialog
      open={saveProjectDialogOpen}
      modal={false}
      disablePointerDismissal
      onOpenChange={(open) => !open && closeSaveProjectDialog()}
    >
      <DialogContent data-modal="false" className="sm:max-w-120">
        <DialogHeader>
          <DialogTitle>
            {saveProjectDialogSaveAs ? "Save Project As" : "Save Project"}
          </DialogTitle>
          <DialogDescription>
            Save the accounts, notes, transactions, scripts and components of
            this workspace, to open it again from the Projects menu.
          </DialogDescription>
        </DialogHeader>
        <form
          id="save-project-form"
          onSubmit={async (event) => {
            event.preventDefault();
            const name = formValue(
              new FormData(event.currentTarget),
              "name",
            ).trim();
            if (!name) {
              return;
            }
            setLoading(true);
            try {
              await saveProjectAs(name);
              toast.success("Project saved.", { description: name });
              closeSaveProjectDialog();
            } catch (error) {
              console.error("ERROR: saveProjectAs", error);
              toast.error("The project couldn't be saved.", {
                description:
                  error instanceof Error ? error.message : String(error),
              });
            } finally {
              setLoading(false);
            }
          }}
        >
          <div className="grid gap-3">
            <Label htmlFor="project-name">Name</Label>
            <Input
              id="project-name"
              name="name"
              defaultValue={defaultName}
              autoComplete="off"
              required
            />
          </div>
        </form>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            Cancel
          </DialogClose>
          <Button form="save-project-form" type="submit" disabled={loading}>
            {loading && <Spinner />}
            {loading ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SaveProjectDialog;
