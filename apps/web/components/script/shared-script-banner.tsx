import { Button } from "@workspace/ui/components/button";
import { Spinner } from "@workspace/ui/components/spinner";
import { GitFork } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import useScripts from "@/hooks/use-scripts";
import useTutorials from "@/hooks/use-tutorials";
import type { Script } from "@/lib/types/script";

// Above the tabs of a script that can't be changed from here (`shared` in
// hooks/use-script.ts): says so, and offers a copy that can. Not during a
// tutorial, whose steps don't expect more scripts.
const SharedScriptBanner = ({ script }: { script: Script }) => {
  const navigate = useNavigate();
  const { forkScript } = useScripts();
  const { tutorialId } = useTutorials();
  const [forking, setForking] = useState(false);
  const fork = async () => {
    setForking(true);
    try {
      const { id, error } = await forkScript(script.id);
      if (!id) {
        toast.error("The script couldn't be forked.", { description: error });
        return;
      }
      toast.success(`${script.name} forked.`, {
        description: "This copy and its dependencies are yours to edit.",
      });
      navigate(`/scripts/${id}`);
    } catch (error) {
      console.error("ERROR: forkScript", error);
      toast.error("The script couldn't be forked.", {
        description: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setForking(false);
    }
  };
  return (
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-md border bg-muted/50 px-3 py-2 text-sm">
      <p className="min-w-0">
        You're viewing a shared script.{" "}
        <span className="text-muted-foreground">
          {tutorialId
            ? "Leave the tutorial to fork it."
            : "Fork it to get a copy you can edit."}
        </span>
      </p>
      {!tutorialId && (
        <Button
          size="sm"
          variant="outline"
          className="ml-auto"
          disabled={forking}
          onClick={fork}
        >
          {forking ? <Spinner /> : <GitFork />}
          {forking ? "Forking…" : "Fork"}
        </Button>
      )}
    </div>
  );
};

export default SharedScriptBanner;
