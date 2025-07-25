import Link from "next/link";
import { Button } from "@workspace/ui/components/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import { formatId } from "@/lib/utils";
import { type InputNote } from "@/lib/types";

const NoteId = ({ inputNote: { id } }: { inputNote: InputNote }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Link href={`/notes/${id}`}>
        <Button className="cursor-pointer -ml-4" variant="link">
          {formatId(id)}
        </Button>
      </Link>
    </TooltipTrigger>
    <TooltipContent>
      <p>{id}</p>
    </TooltipContent>
  </Tooltip>
);

export default NoteId;
