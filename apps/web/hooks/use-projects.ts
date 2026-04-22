// import useGlobalContext from "@/components/global-context/hook";
import { useExportStore } from "@miden-sdk/react";

const useProjects = () => {
  // const { dispatch } = useGlobalContext();
  const { exportStore } = useExportStore();
  const saveProject = async () => {
    const storeDump = await exportStore();
    console.log("STORE_DUMP");
    console.log(JSON.parse(storeDump));
    console.log(storeDump);
    console.log("STATE");
    const state = JSON.parse(localStorage.getItem("state")!);
    state.scripts = [];
    state.components = [];
    console.log(state);
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
