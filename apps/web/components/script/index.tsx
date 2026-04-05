import Script from "@/components/script/script";
import { getScript } from "@/lib/api";
import { isValidUUIDv4 } from "@/lib/utils";

const ScriptIndex = async ({ id }: { id: string }) => {
  const { script } = isValidUUIDv4(id)
    ? await getScript(id)
    : { script: undefined };
  return <Script id={id} serverScript={script} />;
};

export default ScriptIndex;
