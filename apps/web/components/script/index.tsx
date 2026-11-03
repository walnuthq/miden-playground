import Script from "@/components/script/script";
import useScript from "@/hooks/use-script";

const ScriptIndex = ({ id }: { id: string }) => {
  const script = useScript(id);
  return <Script id={id} script={script} />;
};

export default ScriptIndex;
