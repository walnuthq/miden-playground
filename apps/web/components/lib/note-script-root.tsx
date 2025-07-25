import Link from "next/link";
import { Button } from "@workspace/ui/components/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import { formatId } from "@/lib/utils";
import { type InputNote, noteWellKnownNote, noteScriptRoot } from "@/lib/types";

const NoteScriptRoot = ({
  inputNote: { id, inputNote },
}: {
  inputNote: InputNote;
}) => {
  const wellKnownNote = noteWellKnownNote(inputNote);
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link href={`/notes/${id}?tab=code`}>
          <Button className="cursor-pointer -ml-4" variant="link">
            {formatId(noteScriptRoot(inputNote))}
            {wellKnownNote ? ` (${wellKnownNote})` : ""}
          </Button>
        </Link>
      </TooltipTrigger>
      <TooltipContent>
        <p>
          {noteScriptRoot(inputNote)}
          {wellKnownNote ? ` (${wellKnownNote})` : ""}
        </p>
      </TooltipContent>
    </Tooltip>
  );
};

export default NoteScriptRoot;
