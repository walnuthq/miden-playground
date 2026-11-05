import { Button } from "@workspace/ui/components/button";
import { Check, ClipboardPaste } from "lucide-react";
import useApplyCode, { currentSource } from "@/hooks/use-apply-code";
import type { Script } from "@/lib/types/script";
import type { CodeEdit } from "@/lib/utils/tutorial-code";

// Adds a step's code to the user's script, where the step says to type it:
// the way to complete the step on a phone, where the editor is read-only, and
// an alternative to typing elsewhere. `upTo` is the index of the edit it adds,
// along with the earlier ones it builds on. Disabled until the script exists.
const ApplyCodeButton = ({
  script,
  edits,
  upTo = edits.length - 1,
  label = "Add to my script",
  appliedLabel = "Added",
}: {
  script?: Script;
  edits: CodeEdit[];
  upTo?: number;
  label?: string;
  appliedLabel?: string;
}) => {
  const { applyCode } = useApplyCode();
  // Re-rendered with the script, whose files follow the editor's edits.
  const applied = !!script && !!edits[upTo]?.applied(currentSource(script));
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={!script || applied || script.readOnly}
      onClick={() => script && applyCode(script, edits, upTo)}
    >
      {applied ? <Check /> : <ClipboardPaste />}
      {applied ? appliedLabel : label}
    </Button>
  );
};

export default ApplyCodeButton;
