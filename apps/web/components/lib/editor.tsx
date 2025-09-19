import { useTheme } from "next-themes";
import useScripts from "@/hooks/use-scripts";
import MonacoEditor from "@monaco-editor/react";
import { type Script } from "@/lib/types/script";

const Editor = ({
  script,
  language = "rust",
  readOnly = false,
  height = "61vh",
}: {
  script: Script;
  language?: "rust" | "masm";
  readOnly?: boolean;
  height?: string;
}) => {
  const { resolvedTheme } = useTheme();
  const { updateScript } = useScripts();
  return (
    <MonacoEditor
      height={height}
      theme={resolvedTheme === "dark" ? "vs-dark" : "light"}
      defaultLanguage={language === "rust" ? "rust" : "javascript"}
      defaultValue={language === "rust" ? script.rust : script.masm}
      // line={36}
      onChange={
        readOnly
          ? undefined
          : (content) =>
              updateScript({
                ...script,
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
      }}
    />
  );
};

export default Editor;
