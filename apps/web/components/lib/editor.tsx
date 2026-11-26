import MonacoEditor, { type Monaco, type OnMount } from "@monaco-editor/react";
import { useIsMobile } from "@workspace/ui/hooks/use-mobile";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useState } from "react";
import useScripts from "@/hooks/use-scripts";
import { updateEditorSettings, useEditorSettings } from "@/lib/editor-settings";
import { MASM_LANGUAGE_ID, registerMasm } from "@/lib/masm/language";
import { registerSourceEditor } from "@/lib/source-editors";
import type { Script } from "@/lib/types/script";
import {
  type LocatedDiagnostic,
  sourceDiagnostics,
} from "@/lib/utils/diagnostics";
import { filesWithSource, scriptSourcePath } from "@/lib/utils/script-files";

export type CodeEditor = Parameters<OnMount>[0];

type Model = NonNullable<ReturnType<CodeEditor["getModel"]>>;

const MARKER_OWNER = "miden-assembler";

type Marker = ReturnType<typeof toMarker>;

// Monaco draws the markers' squiggles where the text moves them, but keeps the
// markers' own positions, which F8 and the hover widget use. Each model tracks
// its markers with decorations, which follow edits, keyed `line:column` as the
// assembler's output prints their locations.
const trackedMarkers = new WeakMap<
  Model,
  {
    keys: string[];
    markers: Marker[];
    collection: ReturnType<CodeEditor["createDecorationsCollection"]>;
  }
>();

// Moves the markers to where their text went.
const syncMarkers = (monaco: Monaco, model: Model) => {
  const tracked = trackedMarkers.get(model);
  if (!tracked || tracked.markers.length === 0) {
    return;
  }
  monaco.editor.setModelMarkers(
    model,
    MARKER_OWNER,
    tracked.markers.map((marker, index) => {
      const range = tracked.collection.getRange(index);
      return range ? { ...marker, ...range } : marker;
    }),
  );
};

// Where a location of the last compile's output is now in the editor.
export const currentPosition = (
  editor: CodeEditor,
  { line, column }: { line: number; column: number },
) => {
  const model = editor.getModel();
  const tracked = model && trackedMarkers.get(model);
  const index = tracked?.keys.indexOf(`${line}:${column}`) ?? -1;
  const range = index === -1 ? null : tracked?.collection.getRange(index);
  return range
    ? { lineNumber: range.startLineNumber, column: range.startColumn }
    : { lineNumber: line, column };
};

const toMarker = (
  monaco: Monaco,
  model: Model,
  { severity, message, line, column, endColumn }: LocatedDiagnostic,
) => {
  const lineNumber = Math.min(line, model.getLineCount());
  const lineEnd = model.getLineMaxColumn(lineNumber);
  return {
    severity:
      severity === "error"
        ? monaco.MarkerSeverity.Error
        : monaco.MarkerSeverity.Warning,
    message,
    source: MARKER_OWNER,
    startLineNumber: lineNumber,
    startColumn: column,
    endLineNumber: lineNumber,
    // A span past the line's end (one over several lines) stops at it.
    // Without the span's length, underline the word at the location.
    endColumn: Math.min(
      endColumn ??
        model.getWordAtPosition({ lineNumber, column })?.endColumn ??
        column + 1,
      Math.max(lineEnd, column + 1),
    ),
  };
};

// The source is MASM. Monaco has no TOML language: `ini` colors the
// manifest's sections, keys and strings.
const languageOf = (path: string) =>
  path.endsWith(".masm") ? MASM_LANGUAGE_ID : "ini";

// One of the script's files, its source by default. Only the source is edited,
// and gets the compile markers: the manifest is the API's.
const Editor = ({
  script,
  file,
  readOnly = false,
  height = "100%",
  onMount,
}: {
  script: Script;
  file?: string;
  readOnly?: boolean;
  height?: string;
  onMount?: OnMount;
}) => {
  const sourcePath = scriptSourcePath(script);
  const path = file ?? sourcePath;
  const isSource = path === sourcePath;
  const content = script.files[path] ?? "";
  const { resolvedTheme } = useTheme();
  const { updateScript } = useScripts();
  const { minimap, fontSize } = useEditorSettings();
  // No editing on a phone, where Monaco handles touch poorly: tutorials that
  // ask for code there add it with their buttons (lib/utils/tutorial-code).
  // Through the editor's option, not `readOnly`: the buttons edit the model,
  // and `onChange` reports their edits to the app state.
  const isMobile = useIsMobile();
  const [mounted, setMounted] = useState<{
    editor: CodeEditor;
    monaco: Monaco;
  }>();
  // The last compile's diagnostics, which the markers show: a failed
  // compile's errors, a successful one's warnings. Undefined while the script
  // is a draft: edits keep the markers (moved with their text, see
  // syncMarkers) until the next compile replaces them. A draft loaded with an
  // older error shows none, since its code changed since. The API doesn't
  // store diagnostics: a script fetched from there has none.
  const showsDiagnostics = isSource && !readOnly && script.status !== "draft";
  const located = useMemo(
    () =>
      showsDiagnostics
        ? sourceDiagnostics(script.diagnostics ?? [], { name: script.name })
        : undefined,
    [showsDiagnostics, script.diagnostics, script.name],
  );
  useEffect(() => {
    const model = mounted?.editor.getModel();
    if (!mounted || !model || located === undefined) {
      return;
    }
    const markers = located.map((diagnostic) =>
      toMarker(mounted.monaco, model, diagnostic),
    );
    mounted.monaco.editor.setModelMarkers(model, MARKER_OWNER, markers);
    // The problems panel (F8) would keep showing the previous compile's.
    mounted.editor.trigger(MARKER_OWNER, "closeMarkersNavigation", null);
    trackedMarkers.get(model)?.collection.clear();
    trackedMarkers.set(model, {
      keys: markers.map(
        ({ startLineNumber, startColumn }) =>
          `${startLineNumber}:${startColumn}`,
      ),
      markers,
      collection: mounted.editor.createDecorationsCollection(
        markers.map((marker) => ({
          range: marker,
          options: {
            description: "compile-diagnostic-location",
            stickiness:
              mounted.monaco.editor.TrackedRangeStickiness
                .NeverGrowsWhenTypingAtEdges,
          },
        })),
      ),
    });
  }, [mounted, located]);
  return (
    <MonacoEditor
      height={height}
      theme={resolvedTheme === "dark" ? "vs-dark" : "light"}
      defaultLanguage={languageOf(path)}
      beforeMount={registerMasm}
      defaultValue={content}
      // The read-only files follow each compile, including one started from
      // their tab (Cmd+S), which doesn't remount them, and miden-project.toml
      // follows the dependencies added or removed.
      value={isSource ? undefined : content}
      // line={36}
      onMount={(editor, monaco) => {
        editor.onDidChangeModelContent(() => {
          const model = editor.getModel();
          if (model) {
            syncMarkers(monaco, model);
          }
        });
        // Also in the gear menu above the editor; here for VS Code habits
        // (right click, F1). Per editor, unlike `addCommand`.
        editor.addAction({
          id: "playground.toggleMinimap",
          label: "Toggle Minimap",
          contextMenuGroupId: "9_settings",
          run: () =>
            updateEditorSettings({
              minimap: !editor.getOption(monaco.editor.EditorOption.minimap)
                .enabled,
            }),
        });
        if (isSource) {
          registerSourceEditor(script.id, editor);
        }
        setMounted({ editor, monaco });
        onMount?.(editor, monaco);
      }}
      onChange={
        readOnly || !isSource
          ? undefined
          : (content) =>
              updateScript({
                id: script.id,
                status: "draft",
                files: filesWithSource(script, content ?? ""),
              })
      }
      options={{
        minimap: { enabled: minimap },
        fontSize,
        wordWrap: "on",
        readOnly: readOnly || !isSource || isMobile,
        // No virtual keyboard on a phone.
        domReadOnly: isMobile,
        readOnlyMessage:
          isMobile && isSource && !readOnly
            ? {
                value:
                  "Editing isn't available on phones: tutorials add their code with their buttons.",
              }
            : undefined,
        scrollBeyondLastLine: false,
        // Lays out again when shown, e.g. back from a hidden tab.
        automaticLayout: true,
      }}
    />
  );
};

export default Editor;
