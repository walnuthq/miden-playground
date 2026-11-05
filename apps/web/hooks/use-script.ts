import { useQuery } from "@tanstack/react-query";
import useGlobalContext from "@/components/global-context/hook";
import { getScript } from "@/lib/api";
import { isValidUUIDv4 } from "@/lib/utils";

// A script by id: from the local state, or fetched from the API when it isn't
// there (another user's, a shared link). The script page and the header's
// breadcrumb share the query. Reads the app state, not the Miden client, so the
// app shell's breadcrumb can use it before the client is ready.
const useScript = (id: string) => {
  const { scripts } = useGlobalContext();
  const { data } = useQuery({
    queryKey: ["scripts", id],
    queryFn: () => getScript(id),
    enabled: isValidUUIDv4(id),
  });
  return scripts.find((script) => script.id === id) ?? data?.script;
};

export default useScript;
