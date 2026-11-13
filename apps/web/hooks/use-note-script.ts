import { useQuery } from "@tanstack/react-query";
import useNetwork from "@/hooks/use-network";
import useScripts from "@/hooks/use-scripts";
import { getVerifiedNote } from "@/lib/api";
import type { InputNote } from "@/lib/types/note";
import type { Script } from "@/lib/types/script";
import { isValidUUIDv4 } from "@/lib/utils";

// Standard notes are recognized by their built-in script, not verified.
const standardNoteScriptIds = ["p2id", "p2ide", "tx-fee", "fee-sponsorship"];

// The verified script the verification service knows for a note's script
// root, or null. Shared by the notes table and the note page (same query key).
export const useVerifiedNoteScript = (inputNote: InputNote | undefined) => {
  const { networkId } = useNetwork();
  const scriptRoot = inputNote?.scriptRoot ?? "";
  const scriptId = inputNote?.scriptId ?? "";
  const { data } = useQuery({
    queryKey: ["verifiedNote", networkId, scriptRoot],
    queryFn: () =>
      getVerifiedNote({
        networkId,
        script: scriptRoot,
      }),
    enabled:
      ["mm", "mtst", "mdev"].includes(networkId) &&
      !standardNoteScriptIds.includes(scriptId) &&
      scriptRoot !== "",
  });
  const verifiedNoteScript = data?.noteScript ?? null;
  return isValidUUIDv4(verifiedNoteScript?.id ?? "")
    ? verifiedNoteScript
    : null;
};

// The note's own script (built-in or in the project), else its verified one.
const useNoteScript = (inputNote: InputNote): Script | null => {
  const { scripts } = useScripts();
  const verifiedNoteScript = useVerifiedNoteScript(inputNote);
  return (
    scripts.find(({ id }) => id === inputNote.scriptId) ?? verifiedNoteScript
  );
};

export default useNoteScript;
