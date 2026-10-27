import { useParams } from "react-router";
import Component from "@/components/component";

const ComponentPage = () => {
  const { id = "" } = useParams();
  return <Component id={id} />;
};

export default ComponentPage;
