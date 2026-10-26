import { useParams } from "react-router";
import Note from "@/components/note";

const NotePage = () => {
  const { id = "" } = useParams();
  return <Note id={id} />;
};

export default NotePage;
