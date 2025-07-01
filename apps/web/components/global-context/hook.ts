import { useRouter } from "next/navigation";
import { useContext } from "react";
import GlobalContext from "@/components/global-context";

const useGlobalContext = () => {
  const { state, dispatch } = useContext(GlobalContext);
  const router = useRouter();
  const resetState = () => {
    indexedDB.deleteDatabase("MidenClientDB");
    dispatch({ type: "RESET_STATE" });
    router.push("/accounts");
  };
  return { ...state, dispatch, resetState };
};

export default useGlobalContext;
