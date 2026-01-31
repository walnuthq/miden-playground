import Script from "@/components/script/script";
import { getScript } from "@/lib/api";
import { isValidUuidv4 } from "@/lib/utils";

const ScriptIndex = async ({ id }: { id: string }) => {
  const script = isValidUuidv4(id) ? await getScript(id) : null;
  return <Script id={id} serverScript={script} />;
};

export default ScriptIndex;
