import useGlobalContext from "@/components/global-context/hook";
import { webClient } from "@/lib/web-client";

const useProjects = () => {
  const { networkId, dispatch } = useGlobalContext();
  const saveProject = async () => {
    const client = await webClient(networkId);
    const storeDump = await client.exportStore();
    console.log("STORE_DUMP");
    console.log(storeDump);
    console.log("STATE");
    console.log(localStorage.getItem("state"));
    // dispatch({ type: "SAVE_PROJECT" });
  };
  const loadProject = async () => {
    /* const client = await mockWebClient();
    await client.forceImportStore(JSON.stringify(tutorial1StoreDump));
    dispatch({
      type: "LOAD_PROJECT",
      payload: { state: stateDeserializer(JSON.stringify(tutorial1State)) },
    }); */
  };
  return { saveProject, loadProject };
};

export default useProjects;
