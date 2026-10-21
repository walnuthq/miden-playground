import { Button } from "@workspace/ui/components/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import Link from "next/link";
import useScripts from "@/hooks/use-scripts";
import type { InputNote } from "@/lib/types/note";
import { formatId } from "@/lib/utils";

const NoteScriptRoot = ({ inputNote }: { inputNote: InputNote }) => {
  const { scripts } = useScripts();
  const script = scripts.find(({ id }) => id === inputNote.scriptId);
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link href={`/notes/${inputNote.id}?tab=script`}>
          <Button className="cursor-pointer -ml-4" variant="link">
            {formatId(inputNote.scriptRoot)}
            {script ? ` (${script.name})` : ""}
          </Button>
        </Link>
      </TooltipTrigger>
      <TooltipContent>
        <p>
          {inputNote.scriptRoot}
          {script ? ` (${script.name})` : ""}
        </p>
      </TooltipContent>
    </Tooltip>
  );
};

export default NoteScriptRoot;
