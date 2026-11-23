import { useQuery } from "@tanstack/react-query";
import useGlobalContext from "@/components/global-context/hook";
import { getScript } from "@/lib/api";
import { isValidUUIDv4 } from "@/lib/utils";

// A script by id: from the local state, or fetched from the API when it isn't
// there (another user's, a shared link). `shared` tells the script can't be
// changed from here, so it shows read-only, with Fork to get a copy:
// - it isn't in the local state, whose reducers ignore it, or
// - the API says this browser's owner token doesn't own it (lib/owner-token.ts):
//   a script kept from before the token was lost, or claimed by someone else.
// The script page and the header's breadcrumb share the query. Reads the app
// state, not the Miden client, so the app shell's breadcrumb can use it before
// the client is ready.
export const useScriptAccess = (id: string) => {
  const { scripts } = useGlobalContext();
  const { data } = useQuery({
    queryKey: ["scripts", id],
    queryFn: () => getScript(id),
    enabled: isValidUUIDv4(id),
  });
  const localScript = scripts.find((script) => script.id === id);
  if (localScript) {
    // A script that's read-only on its own (a tutorial's starter) isn't
    // shared: there's nothing a fork would add.
    const shared = data?.writable === false && !localScript.readOnly;
    return {
      script: shared ? { ...localScript, readOnly: true } : localScript,
      shared,
    };
  }
  return {
    script: data?.script && { ...data.script, readOnly: true },
    shared: data?.script !== undefined,
  };
};

const useScript = (id: string) => useScriptAccess(id).script;

export default useScript;
