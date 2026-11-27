import { useEffect, useState } from "react";
import { getDefaultDependency } from "@/lib/api";
import type { Script } from "@/lib/types/script";

// The packages of the API's built-in dependencies
// (`BUILT_IN_DEPENDENCY_IDS`, lib/simulation/foreign-accounts.ts), which no
// workspace script holds: asked from the API once per page load, on demand
// (the counter's package is about 530 KB), and kept in memory, never in
// `State`. A failed request is tried again the next time it's needed.
const requests = new Map<string, Promise<Script | undefined>>();
const loaded = new Map<string, Script>();
// The loaded packages as one array, replaced when one is added: a stable
// value between two loads, for the hooks that depend on it.
let packages: Script[] = [];
const listeners = new Set<() => void>();

const load = (id: string) => {
  let request = requests.get(id);
  if (!request) {
    request = getDefaultDependency(id).then((result) => {
      if ("error" in result) {
        requests.delete(id);
        return undefined;
      }
      loaded.set(id, result.script);
      packages = [...loaded.values()];
      for (const listener of listeners) {
        listener();
      }
      return result.script;
    });
    requests.set(id, request);
  }
  return request;
};

// The built-in packages loaded so far, asking for `ids`. `settled` is false
// while one of `ids` is still being asked for: it may yet resolve.
export const useBuiltInDependencies = (ids: string[]) => {
  const [, setVersion] = useState(0);
  const [failed, setFailed] = useState<ReadonlySet<string>>(new Set());
  const key = ids.join(",");
  useEffect(() => {
    const listener = () => setVersion((version) => version + 1);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);
  useEffect(() => {
    let current = true;
    for (const id of key === "" ? [] : key.split(",")) {
      if (!loaded.has(id)) {
        void load(id).then((script) => {
          if (current && !script) {
            setFailed((ids) => new Set(ids).add(id));
          }
        });
      }
    }
    return () => {
      current = false;
    };
  }, [key]);
  return {
    packages,
    settled: ids.every((id) => loaded.has(id) || failed.has(id)),
  };
};
