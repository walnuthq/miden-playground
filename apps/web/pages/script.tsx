import { useParams } from "react-router";
import Script from "@/components/script";
import useWakeCompiler from "@/hooks/use-wake-compiler";

const ScriptPage = () => {
  const { id = "" } = useParams();
  // Compiling happens here: wake api-compile before the first one.
  useWakeCompiler();
  // React Router reuses this page when only `:id` changes. Keying it remounts
  // the editor (Monaco only reads `defaultValue` on mount) and resets the
  // console, so another script's code is never shown or saved under this id.
  return <Script key={id} id={id} />;
};

export default ScriptPage;
