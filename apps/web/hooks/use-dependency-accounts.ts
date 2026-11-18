import { useMemo } from "react";
import useGlobalContext from "@/components/global-context/hook";
import { foreignDependencies } from "@/lib/simulation/foreign-accounts";
import { useEmbeddedPackages } from "@/lib/simulation/load-embedded-packages";
import {
  initialStorageSlots,
  shownStorageSlots,
} from "@/lib/simulation/simulated-accounts";
import {
  foreignSlotsKey,
  setSimulationStorageSlots,
  useEditedStorageSlots,
} from "@/lib/simulation/simulation-state";
import type { Dependency, Script, StorageSchema } from "@/lib/types/script";
import type { StorageSlot } from "@/lib/types/storage-slot";

// An account a simulation builds from one of the script's
// `account-component` dependencies: a foreign account staged for an account
// component's calls, or a component of a note or transaction script's
// simulated target.
export type DependencyAccount = {
  name: string;
  dependency: Dependency;
  // The package it's built from.
  script: Script;
  storageSlots: StorageSlot[];
  setStorageSlots: (storageSlots: StorageSlot[]) => void;
  schema?: StorageSchema;
};

// A dependency whose package can't be found, and why.
export type UnresolvedDependency = {
  name: string;
  reason: "stale" | "missing";
};

// The script's `account-component` dependencies whose package the workspace
// or the web app holds (`foreignDependencies`), each with the storage slots
// its account starts from, edited in the Simulate tab. Their slots are keyed
// `foreignSlotsKey(script.id, name)`: a script is either an account component
// (foreign accounts) or a note or transaction script (its target's
// components), never both.
const useDependencyAccounts = (script: Script) => {
  const { scripts } = useGlobalContext();
  const needsEmbedded = script.dependencies.some(
    ({ type }) => type === "account-component",
  );
  const embedded = useEmbeddedPackages(needsEmbedded);
  const edited = useEditedStorageSlots();
  const { accounts, unresolved } = useMemo(() => {
    const resolved = foreignDependencies(script, scripts, embedded ?? []);
    const accounts: DependencyAccount[] = [];
    const unresolved: UnresolvedDependency[] = [];
    for (const resolution of resolved) {
      const { name } = resolution.dependency;
      if ("reason" in resolution) {
        // Until the embedded packages are loaded, one may still resolve.
        if (embedded || resolution.reason === "stale") {
          unresolved.push({ name, reason: resolution.reason });
        }
        continue;
      }
      const key = foreignSlotsKey(script.id, name);
      const schema = resolution.script.metadata?.storage;
      accounts.push({
        name,
        dependency: resolution.dependency,
        script: resolution.script,
        storageSlots: shownStorageSlots(
          schema,
          edited.get(key) ?? initialStorageSlots(resolution.script),
        ),
        setStorageSlots: (storageSlots) =>
          setSimulationStorageSlots(key, storageSlots),
        schema,
      });
    }
    return { accounts, unresolved };
  }, [script, scripts, embedded, edited]);
  // The embedded packages aren't loaded yet: a dependency may still resolve.
  const ready = !needsEmbedded || embedded !== undefined;
  return { accounts, unresolved, ready };
};

export default useDependencyAccounts;
