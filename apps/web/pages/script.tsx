import { useParams } from "react-router";
import Script from "@/components/script";

const ScriptPage = () => {
  const { id = "" } = useParams();
  // React Router reuses this page when only `:id` changes. Keying it remounts
  // the editor (Monaco only reads `defaultValue` on mount) and resets the
  // console, so another script's code is never shown or saved under this id.
  return <Script key={id} id={id} />;
};

export default ScriptPage;
