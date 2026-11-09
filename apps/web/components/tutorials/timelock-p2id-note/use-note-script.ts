import useScripts from "@/hooks/use-scripts";
import { defaultScriptIds } from "@/lib/types/default-scripts";

// The note script the user creates in step 1 and builds on: its id is the
// API's UUID and its name theirs to choose.
const useNoteScript = () => {
  const { scripts } = useScripts();
  return scripts.find(
    ({ id, type }) => !defaultScriptIds.includes(id) && type === "note",
  );
};

export default useNoteScript;
