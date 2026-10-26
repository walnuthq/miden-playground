import { useParams } from "react-router";
import Script from "@/components/script";

const ScriptPage = () => {
  const { id = "" } = useParams();
  return <Script id={id} />;
};

export default ScriptPage;
