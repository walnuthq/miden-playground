import Link from "next/link";
import { Button } from "@workspace/ui/components/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import { formatId } from "@/lib/utils";
import { type InputNote } from "@/lib/types";

const NoteScriptRoot = ({ inputNote }: { inputNote: InputNote }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Link href={`/notes/${inputNote.id}?tab=code`}>
        <Button className="cursor-pointer -ml-4" variant="link">
          {formatId(inputNote.scriptRoot)}
          {inputNote.wellKnownNote ? ` (${inputNote.wellKnownNote})` : ""}
        </Button>
      </Link>
    </TooltipTrigger>
    <TooltipContent>
      <p>
        {inputNote.scriptRoot}
        {inputNote.wellKnownNote ? ` (${inputNote.wellKnownNote})` : ""}
      </p>
    </TooltipContent>
  </Tooltip>
);

export default NoteScriptRoot;
