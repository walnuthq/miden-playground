import { useTheme } from "next-themes";
import useScripts from "@/hooks/use-scripts";
import Editor from "@monaco-editor/react";
import { type Script } from "@/lib/types";

const ScriptRust = ({
  script,
  readOnly = false,
}: {
  script: Script;
  readOnly?: boolean;
}) => {
  const { resolvedTheme } = useTheme();
  const { updateScript } = useScripts();
  return (
    <Editor
      height="85vh"
      theme={resolvedTheme === "dark" ? "vs-dark" : "light"}
      defaultLanguage="rust"
      defaultValue={script.content}
      onChange={(content) =>
        content && updateScript({ ...script, content, updatedAt: Date.now() })
      }
      options={{
        minimap: { enabled: false },
        wordWrap: "on",
        readOnly,
        scrollBeyondLastLine: false,
      }}
    />
  );
};

export default ScriptRust;
