import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import { useLocation, useNavigate, useSearchParams } from "react-router";
import Editor from "@/components/lib/editor";
import NotFound from "@/components/lib/not-found";
import AddDependencyDialog from "@/components/script/add-dependency-dialog";
import EditorConsole from "@/components/script/editor-console";
import ScriptMetadata from "@/components/script/script-metadata";
import useScripts from "@/hooks/use-scripts";
import type { Script } from "@/lib/types/script";

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
  const script = scripts.find((script) => script.id === id) ?? serverScript;
  if (!script) {
    return <NotFound />;
  }
  const defaultTab = script.rust !== "" ? "rust" : "masm";
  const tab = searchParams.get("tab") ?? defaultTab;
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
          <TabsContent value="rust">
            <Editor
              script={script}
              language="rust"
              readOnly={script.readOnly}
              height={script.readOnly ? "85vh" : "61vh"}
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
          {!script.readOnly && tab !== "metadata" && (
            <EditorConsole script={script} />
          )}
        </div>
      </Tabs>
      <AddDependencyDialog />
    </div>
  );
};

export default ScriptComponent;
