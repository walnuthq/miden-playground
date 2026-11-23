import { Button } from "@workspace/ui/components/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import { Share2 } from "lucide-react";
import type { Script } from "@/lib/types/script";
import { shareScript } from "@/lib/utils/share-script";

// In the tabs row, before the editor settings: copies the script's link.
const ShareScriptButton = ({ script }: { script: Script }) => (
  <Tooltip>
    <TooltipTrigger
      delay={300}
      render={
        <Button
          variant="ghost"
          size="icon"
          aria-label="Share"
          onClick={() => shareScript(script)}
        />
      }
    >
      <Share2 />
    </TooltipTrigger>
    <TooltipContent>Copy a link to this script</TooltipContent>
  </Tooltip>
);

export default ShareScriptButton;
