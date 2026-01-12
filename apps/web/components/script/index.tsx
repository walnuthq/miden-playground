import Script from "@/components/script/script";
import { getScript } from "@/lib/api";

const ScriptIndex = async ({ id }: { id: string }) => {
  const script = id.includes("_") ? null : await getScript(id);
  return <Script id={id} serverScript={script} />;
};

export default ScriptIndex;
