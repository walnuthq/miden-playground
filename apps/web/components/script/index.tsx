"use client";
import { useIsClient } from "usehooks-ts";
import useScripts from "@/hooks/use-scripts";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import ScriptRust from "@/components/script/script-rust";
import ScriptMASM from "@/components/script/script-masm";

const Script = ({ id }: { id: string }) => {
  const isClient = useIsClient();
  const { scripts } = useScripts();
  const script = scripts.find((script) => script.id === id);
  if (!isClient || !script) {
    return null;
  }
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <Tabs defaultValue="masm">
        <TabsList>
          <TabsTrigger value="rust">Rust</TabsTrigger>
          <TabsTrigger value="masm">MASM</TabsTrigger>
        </TabsList>
        <TabsContent value="rust">
          <ScriptRust
            script={script}
            readOnly={script.id === "counter-contract"}
          />
        </TabsContent>
        <TabsContent value="masm">
          <ScriptMASM script={script} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Script;
