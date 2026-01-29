"use client";
import {
  useRouter,
  usePathname,
  useSearchParams,
  notFound,
} from "next/navigation";
import { type Script } from "@/lib/types/script";
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
import ScriptMetadata from "@/components/script/script-metadata";
import AddDependencyDialog from "@/components/script/add-dependency-dialog";

const ScriptComponent = ({
  id,
  serverScript,
}: {
  id: string;
  serverScript: Script | null;
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isClient = useIsClient();
  const { scripts } = useScripts();
  if (!isClient) {
    return null;
  }
  const script = scripts.find((script) => script.id === id) ?? serverScript;
  if (!script) {
    notFound();
  }
  const tab = searchParams.get("tab") ?? "rust";
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <Tabs
        defaultValue={tab}
        onValueChange={(value) =>
          router.push(
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
