import { toast } from "sonner";
import useScripts from "@/hooks/use-scripts";
import { sourceEditor } from "@/lib/source-editors";
import type { Script } from "@/lib/types/script";
import { SCRIPT_FILE, scriptSource } from "@/lib/utils/script-files";
import { applyCodeEdits, type CodeEdit } from "@/lib/utils/tutorial-code";

// A script's source as the user sees it: its open editor's, else the state's.
export const currentSource = (script: Script) =>
  sourceEditor(script.id)?.getModel()?.getValue() ?? scriptSource(script);

// Applies a tutorial's code edits to a script. In its open editor, as a single
// edit of the changed range, which `onChange` reports to the app state (as a
// draft) and Cmd/Ctrl+Z undoes; the added code is selected and scrolled to.
// Without an editor (another page), the state takes the new source, the same
// update typing makes.
const useApplyCode = () => {
  const { updateScript } = useScripts();
  const applyCode = (script: Script, edits: CodeEdit[], upTo?: number) => {
    const source = currentSource(script);
    const next = applyCodeEdits(source, edits, upTo);
    if (next === null) {
      toast.error("Couldn't find where to add this code.", {
        description:
          "Your code differs from the example there: undo your changes (Cmd/Ctrl+Z), or edit it by hand.",
      });
      return;
    }
    if (next === source) {
      return;
    }
    const editor = sourceEditor(script.id);
    const model = editor?.getModel();
    if (!editor || !model) {
      updateScript({
        id: script.id,
        status: "draft",
        files: { ...script.files, [SCRIPT_FILE]: next },
        masm: "",
      });
      return;
    }
    // The changed range: what's left between the common prefix and suffix.
    let prefix = 0;
    while (
      prefix < source.length &&
      prefix < next.length &&
      source[prefix] === next[prefix]
    ) {
      prefix++;
    }
    let suffix = 0;
    while (
      suffix < source.length - prefix &&
      suffix < next.length - prefix &&
      source[source.length - 1 - suffix] === next[next.length - 1 - suffix]
    ) {
      suffix++;
    }
    const start = model.getPositionAt(prefix);
    const end = model.getPositionAt(source.length - suffix);
    const text = next.slice(prefix, next.length - suffix);
    editor.pushUndoStop();
    model.pushEditOperations(
      [],
      [
        {
          range: {
            startLineNumber: start.lineNumber,
            startColumn: start.column,
            endLineNumber: end.lineNumber,
            endColumn: end.column,
          },
          text,
        },
      ],
      () => null,
    );
    editor.pushUndoStop();
    const insertedEnd = model.getPositionAt(prefix + text.length);
    const inserted = {
      startLineNumber: start.lineNumber,
      startColumn: start.column,
      endLineNumber: insertedEnd.lineNumber,
      endColumn: insertedEnd.column,
    };
    editor.setSelection(inserted);
    editor.revealRangeInCenter(inserted);
  };
  return { applyCode };
};

export default useApplyCode;
