import MonacoEditor, { type Monaco, type OnMount } from "@monaco-editor/react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import useScripts from "@/hooks/use-scripts";
import type { Script } from "@/lib/types/script";
import {
  type Diagnostic,
  parseDiagnostics,
  SCRIPT_FILE,
} from "@/lib/utils/diagnostics";

export type CodeEditor = Parameters<OnMount>[0];

type Model = NonNullable<ReturnType<CodeEditor["getModel"]>>;

const MARKER_OWNER = "cargo-miden";

type Marker = ReturnType<typeof toMarker>;

// Monaco draws the markers' squiggles where the text moves them, but keeps the
// markers' own positions, which F8 and the hover widget use. Each model tracks
// its markers with decorations, which follow edits, keyed `line:column` as the
// compile output prints their locations.
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
  { severity, message, code, line, column, endColumn }: Diagnostic,
) => {
  const lineNumber = Math.min(line, model.getLineCount());
  return {
    severity:
      severity === "error"
        ? monaco.MarkerSeverity.Error
        : monaco.MarkerSeverity.Warning,
    message,
    code,
    source: MARKER_OWNER,
    startLineNumber: lineNumber,
    startColumn: column,
    endLineNumber: lineNumber,
    // Without the span's width, underline the word at the location.
    endColumn:
      endColumn ??
      model.getWordAtPosition({ lineNumber, column })?.endColumn ??
      column + 1,
  };
};

const Editor = ({
  script,
  language = "rust",
  readOnly = false,
  height = "61vh",
  onMount,
}: {
  script: Script;
  language?: "rust" | "masm";
  readOnly?: boolean;
  height?: string;
  onMount?: OnMount;
}) => {
  const { resolvedTheme } = useTheme();
  const { updateScript } = useScripts();
  const [mounted, setMounted] = useState<{
    editor: CodeEditor;
    monaco: Monaco;
  }>();
  // The last compile's output, which the markers show. Undefined while the
  // script is a draft: edits keep the markers (moved with their text, see
  // syncMarkers) until the next compile replaces them. A draft loaded with an
  // older error shows none, since its code changed since.
  const compileOutput =
    language !== "rust" || readOnly
      ? undefined
      : script.status === "error"
        ? // The API doesn't store errors: a script fetched from there has none.
          (script.error ?? "")
        : script.status === "compiled"
          ? ""
          : undefined;
  useEffect(() => {
    const model = mounted?.editor.getModel();
    if (!mounted || !model || compileOutput === undefined) {
      return;
    }
    const markers = parseDiagnostics(compileOutput)
      .filter(({ file }) => file === SCRIPT_FILE)
      .map((diagnostic) => toMarker(mounted.monaco, model, diagnostic));
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
  }, [mounted, compileOutput]);
  return (
    <MonacoEditor
      height={height}
      theme={resolvedTheme === "dark" ? "vs-dark" : "light"}
      defaultLanguage={language === "rust" ? "rust" : "javascript"}
      defaultValue={language === "rust" ? script.rust : script.masm}
      // line={36}
      onMount={(editor, monaco) => {
        editor.onDidChangeModelContent(() => {
          const model = editor.getModel();
          if (model) {
            syncMarkers(monaco, model);
          }
        });
        setMounted({ editor, monaco });
        onMount?.(editor, monaco);
      }}
      onChange={
        readOnly
          ? undefined
          : (content) =>
              updateScript({
                id: script.id,
                status: "draft",
                rust: content ?? "",
                masm: "",
              })
      }
      options={{
        minimap: { enabled: false },
        wordWrap: "on",
        readOnly,
        scrollBeyondLastLine: false,
        // Lays out again when shown, e.g. back from a hidden tab.
        automaticLayout: true,
      }}
    />
  );
};

export default Editor;
