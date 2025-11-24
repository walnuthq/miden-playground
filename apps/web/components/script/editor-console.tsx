import { useState } from "react";
import { Play } from "lucide-react";
import { Spinner } from "@workspace/ui/components/spinner";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import { defaultProcedure, type Script } from "@/lib/types/script";
import useScripts from "@/hooks/use-scripts";
import { cn } from "@workspace/ui/lib/utils";
import { compileScript } from "@/lib/api";

// const getProcedures = async (packageBytes: number[]) => {
//   const {
//     Package: WasmPackage,
//     AccountComponent: WasmAccountComponent,
//     MidenArrays: WasmMidenArrays,
//   } = await import("@demox-labs/miden-sdk");
//   const accountComponent = WasmAccountComponent.fromPackage(
//     WasmPackage.deserialize(new Uint8Array(packageBytes)),
//     new WasmMidenArrays.StorageSlotArray([])
//   );
//   const procedures = accountComponent.getProcedures().map();
//   console.log(accountComponent.getProcedures());
//   return [];
// };

const EditorConsole = ({ script }: { script: Script }) => {
  const { updateScript } = useScripts();
  const [loading, setLoading] = useState(false);
  const compile = async () => {
    setLoading(true);
    const { error, masm, root, packageBytes, procedures } =
      await compileScript(script);
    updateScript({
      ...script,
      error,
      masm,
      status: masm
        ? "compiled"
        : packageBytes.length > 0
          ? "compiled"
          : "draft",
      root,
      packageBytes,
      procedures: procedures.map((procedure) => ({
        ...defaultProcedure(),
        ...procedure,
        // readOnly: procedure.name === "get_count",
        // storageRead:
        //   procedure.name === "get_count"
        //     ? { type: "value", index: 0 }
        //     : undefined,
      })),
    });
    setLoading(false);
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle>Editor Console</CardTitle>
        <CardAction>
          <Button disabled={loading} onClick={compile}>
            {loading ? <Spinner /> : <Play />}
            {loading ? "Compiling…" : script.error ? "Re-compile" : "Compile"}
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="h-32 overflow-y-auto">
        <pre
          className={cn("font-mono text-xs", {
            "text-destructive": !!script.error,
          })}
        >
          {script.error
            ? script.error
            : script.masm
              ? "Script compiled to MASM."
              : script.packageBytes.length > 0
                ? "Script compiled successfully."
                : ""}
        </pre>
      </CardContent>
    </Card>
  );
};

export default EditorConsole;
