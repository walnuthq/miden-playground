import { useContext } from "react";
import GlobalContext from "@/components/global-context";

const useGlobalContext = () => {
  const { state, dispatch } = useContext(GlobalContext);
  return {
    ...state,
    dispatch,
  };
};

export default useGlobalContext;
