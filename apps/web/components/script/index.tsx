"use client";
import { useIsClient } from "usehooks-ts";
import useScripts from "@/hooks/use-scripts";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import Editor from "@/components/lib/editor";
import EditorConsole from "@/components/script/editor-console";
import DependenciesTable from "@/components/script/dependencies-table";

const Script = ({ id }: { id: string }) => {
  const isClient = useIsClient();
  const { scripts } = useScripts();
  const script = scripts.find((script) => script.id === id);
  if (!isClient || !script) {
    return null;
  }
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <Tabs defaultValue="rust">
        <TabsList>
          <TabsTrigger value="rust">Rust</TabsTrigger>
          <TabsTrigger value="masm">MASM</TabsTrigger>
          {script.dependencies.length > 0 && (
            <TabsTrigger value="dependencies">Dependencies</TabsTrigger>
          )}
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
          <TabsContent value="masm">
            <Editor
              script={script}
              language="masm"
              readOnly
              height={script.readOnly ? "85vh" : "61vh"}
            />
          </TabsContent>
          {script.dependencies.length > 0 && (
            <TabsContent value="dependencies">
              <div className={script.readOnly ? "h-[85vh]" : "h-[61vh]"}>
                <DependenciesTable script={script} />
              </div>
            </TabsContent>
          )}
          {!script.readOnly && <EditorConsole script={script} />}
        </div>
      </Tabs>
    </div>
  );
};

export default Script;
