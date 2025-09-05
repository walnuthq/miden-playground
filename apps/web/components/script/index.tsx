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
import defaultScripts from "@/components/global-context/default-scripts";

const Script = ({ id }: { id: string }) => {
  const isClient = useIsClient();
  const { scripts } = useScripts();
  const script = scripts.find((script) => script.id === id);
  if (!isClient || !script) {
    return null;
  }
  const defaultScriptIds = defaultScripts.map(({ id }) => id);
  const defaultScript = defaultScriptIds.includes(script.id);
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <Tabs defaultValue="rust">
        <TabsList>
          <TabsTrigger value="rust">Rust</TabsTrigger>
          <TabsTrigger value="masm">MASM</TabsTrigger>
        </TabsList>
        <div className="flex flex-col gap-4">
          <TabsContent value="rust">
            <Editor
              script={script}
              language="rust"
              readOnly={defaultScript}
              height={defaultScript ? "85vh" : "61vh"}
            />
          </TabsContent>
          <TabsContent value="masm">
            <Editor
              script={script}
              language="masm"
              readOnly
              height={defaultScript ? "85vh" : "61vh"}
            />
          </TabsContent>
          {!defaultScript && <EditorConsole script={script} />}
        </div>
      </Tabs>
    </div>
  );
};

export default Script;
