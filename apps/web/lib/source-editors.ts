import type { CodeEditor } from "@/components/lib/editor";

// The mounted source (`src/lib.rs`) editors, by script id. The source editor
// is uncontrolled: code added from outside it (a tutorial's "add to my script"
// button) goes through its model while it's open, which reports the change
// to the app state as typing does, with undo.
const sourceEditors = new Map<string, CodeEditor>();

export const registerSourceEditor = (scriptId: string, editor: CodeEditor) => {
  sourceEditors.set(scriptId, editor);
  editor.onDidDispose(() => {
    if (sourceEditors.get(scriptId) === editor) {
      sourceEditors.delete(scriptId);
    }
  });
};

export const sourceEditor = (scriptId: string) => sourceEditors.get(scriptId);
