import { useTheme } from "next-themes";
import Editor from "@monaco-editor/react";
import { type Script } from "@/lib/types";

const ScriptMASM = ({ script }: { script: Script }) => {
  const { resolvedTheme } = useTheme();
  return (
    <Editor
      height="85vh"
      theme={resolvedTheme === "dark" ? "vs-dark" : "light"}
      defaultLanguage="javascript"
      defaultValue={script.masm}
      options={{
        minimap: { enabled: false },
        wordWrap: "on",
        readOnly: true,
        scrollBeyondLastLine: false,
      }}
    />
  );
};

export default ScriptMASM;
