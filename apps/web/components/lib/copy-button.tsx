import { Button } from "@workspace/ui/components/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { sleep } from "@/lib/utils";

const CopyButton = ({ content, copy }: { content: string; copy: string }) => {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const copyText = async () => {
    setOpen(true);
    await navigator.clipboard.writeText(copy);
    setCopied(true);
    await sleep(1000);
    setOpen(false);
    await sleep(100);
    setCopied(false);
  };
  return (
    <Tooltip open={open} onOpenChange={setOpen}>
      {/*<TooltipTrigger
        className="text-muted-foreground hover:text-primary hover:brightness-150"
        onClick={copied ? undefined : copyText}
      >
        {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
      </TooltipTrigger> */}
      <TooltipTrigger
        delay={100}
        render={
          <Button
            variant="secondary"
            className="size-8"
            onClick={copied ? undefined : copyText}
          />
        }
      >
        {copied ? <Check /> : <Copy />}
      </TooltipTrigger>
      <TooltipContent>
        <p>{copied ? "Copied!" : content}</p>
      </TooltipContent>
    </Tooltip>
  );
};

export default CopyButton;
