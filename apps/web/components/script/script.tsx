import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import { useEffect, useRef } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router";
import Editor, {
  type CodeEditor,
  currentPosition,
} from "@/components/lib/editor";
import NotFound from "@/components/lib/not-found";
import AddDependencyDialog from "@/components/script/add-dependency-dialog";
import EditorConsole, {
  type EditorLocation,
} from "@/components/script/editor-console";
import ScriptMetadata from "@/components/script/script-metadata";
import useScripts from "@/hooks/use-scripts";
import type { Script } from "@/lib/types/script";

// Puts the cursor on a location of the last compile's output. The code may have
// changed since the compile: follow the location.
const reveal = (editor: CodeEditor, location: EditorLocation) => {
  const position = currentPosition(editor, location);
  editor.setPosition(position);
  editor.revealPositionInCenter(position);
  editor.focus();
};

const ScriptComponent = ({
  id,
  serverScript,
}: {
  id: string;
  serverScript?: Script;
}) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const { scripts } = useScripts();
  // The Rust editor, for the console's links to its locations.
  const editorRef = useRef<CodeEditor | null>(null);
  // A link clicked on another tab, revealed once the Rust tab shows.
  const pendingReveal = useRef<EditorLocation | null>(null);
  const script = scripts.find((script) => script.id === id) ?? serverScript;
  const defaultTab = script?.rust !== "" ? "rust" : "masm";
  const tab = searchParams.get("tab") ?? defaultTab;
  useEffect(() => {
    const editor = editorRef.current;
    const location = pendingReveal.current;
    if (tab !== "rust" || !editor || !location) {
      return;
    }
    pendingReveal.current = null;
    // Measure it now it's visible, or the reveal centers in a zero-size view.
    editor.layout();
    reveal(editor, location);
  }, [tab]);
  if (!script) {
    return <NotFound />;
  }
  // The console shows on every tab, but its locations are in the Rust code:
  // switch to it first. The editor stays mounted on the other tabs.
  const revealLocation = (location: EditorLocation) => {
    const editor = editorRef.current;
    if (tab === "rust" && editor) {
      reveal(editor, location);
    } else {
      pendingReveal.current = location;
      navigate(pathname);
    }
  };
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <Tabs
        value={tab}
        onValueChange={(value) =>
          navigate(
            value === "rust"
              ? pathname
              : `${pathname}?${new URLSearchParams({ tab: value })}`,
          )
        }
      >
        <TabsList>
          <TabsTrigger value="rust">Rust</TabsTrigger>
          {script.masm && <TabsTrigger value="masm">MASM</TabsTrigger>}
          <TabsTrigger value="metadata">Metadata</TabsTrigger>
        </TabsList>
        <div className="flex flex-col gap-4">
          {/* Kept mounted across tabs: its undo history, scroll position and
              compile markers survive a look at the metadata. */}
          <TabsContent value="rust" keepMounted>
            <Editor
              script={script}
              language="rust"
              readOnly={script.readOnly}
              height={script.readOnly ? "85vh" : "61vh"}
              onMount={(editor) => {
                editorRef.current = editor;
              }}
            />
          </TabsContent>
          {script.masm && (
            <TabsContent value="masm">
              <Editor
                script={script}
                language="masm"
                readOnly
                height={script.readOnly ? "85vh" : "61vh"}
              />
            </TabsContent>
          )}
          <TabsContent value="metadata">
            <div className={script.readOnly ? "h-[85vh]" : "h-[61vh]"}>
              <ScriptMetadata script={script} />
            </div>
          </TabsContent>
          {!script.readOnly && (
            <EditorConsole script={script} onRevealLocation={revealLocation} />
          )}
        </div>
      </Tabs>
      <AddDependencyDialog />
    </div>
  );
};

export default ScriptComponent;
