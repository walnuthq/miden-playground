import useScripts from "@/hooks/use-scripts";
import { type Component } from "@/lib/types/component";
import Editor from "@/components/lib/editor";

const ComponentScript = ({ component }: { component: Component }) => {
  const { scripts } = useScripts();
  const script = scripts.find(({ id }) => id === component.scriptId);
  if (!script) {
    return null;
  }
  return <Editor script={script} language="rust" readOnly height="85vh" />;
};

export default ComponentScript;
