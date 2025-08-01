import Link from "next/link";
import { Button } from "@workspace/ui/components/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import { formatId } from "@/lib/utils";

const NoteId = ({ noteId }: { noteId: string }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Link href={`/notes/${noteId}`}>
        <Button className="cursor-pointer -ml-4" variant="link">
          {formatId(noteId)}
        </Button>
      </Link>
    </TooltipTrigger>
    <TooltipContent>
      <p>{noteId}</p>
    </TooltipContent>
  </Tooltip>
);

export default NoteId;
