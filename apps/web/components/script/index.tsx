import Script from "@/components/script/script";
import { useScriptAccess } from "@/hooks/use-script";

const ScriptIndex = ({ id }: { id: string }) => {
  const { script, shared } = useScriptAccess(id);
  return <Script id={id} script={script} shared={shared} />;
};

export default ScriptIndex;
