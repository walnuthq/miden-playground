import { useEffect, useMemo, useState } from "react";
import useGlobalContext from "@/components/global-context/hook";
import useComponents from "@/hooks/use-components";
import { appendConsoleEntry } from "@/lib/console-log";
import type { ForeignAccountsStatus } from "@/lib/simulation/blocked";
import {
  foreignDependencies,
  simulatedAccountName,
  simulatedAccountValue,
} from "@/lib/simulation/foreign-accounts";
import {
  createSimulatedAccount,
  type SimulationResult,
  simulateProcedure,
  stageForeignAccount,
  storageChanges,
} from "@/lib/simulation/run";
import {
  enqueueSimulation,
  withSimulationClient,
} from "@/lib/simulation/simulation-client";
import {
  foreignSlotsKey,
  setSimulationStorageSlots,
  useEditedStorageSlots,
  useSimulationStorageSlots,
} from "@/lib/simulation/simulation-state";
import type { Account } from "@/lib/types/account";
import type { Component, StorageSlot } from "@/lib/types/component";
import type {
  Dependency,
  ProcedureExport,
  Script,
  StorageSchema,
} from "@/lib/types/script";
import {
  cleanExecutionError,
  encodeProcedureArguments,
  type ProcedureArguments,
  procedureParams,
} from "@/lib/utils/procedure-inputs";
import { formatProcedureExportPath } from "@/lib/utils/script";
import {
  mergeStorageSlots,
  schemaStorageSlots,
} from "@/lib/utils/storage-schema";
import { effectiveStorageChanges } from "@/lib/utils/storage-slots";
import { accountIdParts } from "@/lib/web-client";

const NO_SLOTS: StorageSlot[] = [];

// The simulated accounts of each mock client, by package and storage: an
// account's id depends on its storage, so each edit is a new one. A client
// that crashed is replaced by a new one, with an empty store.
const simulatedAccountsByClient = new WeakMap<
  object,
  Map<string, Promise<Account>>
>();

const simulatedAccount = (
  client: object,
  key: string,
  create: () => Promise<Account>,
): Promise<Account> => {
  let simulatedAccounts = simulatedAccountsByClient.get(client);
  if (!simulatedAccounts) {
    simulatedAccounts = new Map();
    simulatedAccountsByClient.set(client, simulatedAccounts);
  }
  const existing = simulatedAccounts.get(key);
  if (existing) {
    return existing;
  }
  const created = create();
  simulatedAccounts.set(key, created);
  created.catch(() => simulatedAccounts.delete(key));
  return created;
};

// The slots a script's simulations start from: those of the package's
// storage schema, at their defaults. Without one (a package compiled before
// the API returned it), the slots of a component of the workspace made from
// the script.
const initialStorageSlots = (script: Script, components: Component[]) => {
  const schema = script.metadata?.storage;
  return schema
    ? schemaStorageSlots(schema)
    : (components.find(({ scriptId }) => scriptId === script.id)
        ?.storageSlots ?? NO_SLOTS);
};

// The slots shown: the user's edits over the initial ones. A recompile can
// change the schema: the edits of the slots it still has stay, the others go.
const shownStorageSlots = (
  schema: StorageSchema | undefined,
  slots: StorageSlot[],
) => (schema ? mergeStorageSlots(schema, slots) : slots);

// The packages the web app embeds, loaded once, on demand: their masp is
// large and the script page mustn't carry it.
let embeddedPackagesPromise: Promise<Script[]> | undefined;
let embeddedPackages: Script[] | undefined;

const loadEmbeddedPackages = () => {
  embeddedPackagesPromise ??= import("@/lib/simulation/embedded-packages")
    .then((module) => {
      embeddedPackages = module.embeddedPackages;
      return module.embeddedPackages;
    })
    .catch((error) => {
      embeddedPackagesPromise = undefined;
      throw error;
    });
  return embeddedPackagesPromise;
};

const useEmbeddedPackages = (needed: boolean) => {
  const [loaded, setLoaded] = useState(embeddedPackages);
  useEffect(() => {
    if (needed && !loaded) {
      loadEmbeddedPackages().then(setLoaded, () => {});
    }
  }, [needed, loaded]);
  return loaded;
};

// An account staged on the mock chain for a script's foreign calls, from one
// of its `account-component` dependencies.
export type ForeignAccount = {
  name: string;
  dependency: Dependency;
  // The package it's built from.
  script: Script;
  storageSlots: StorageSlot[];
  setStorageSlots: (storageSlots: StorageSlot[]) => void;
  schema?: StorageSchema;
};

// A dependency that can't be staged, and why.
export type UnresolvedForeignAccount = {
  name: string;
  reason: "stale" | "missing";
};

const plural = (count: number, noun: string) =>
  `${count} ${noun}${count === 1 ? "" : "s"}`;

// The console's line for a run.
const summary = (
  name: string,
  result: SimulationResult & { ok: true },
  account: Account,
) => {
  const changes =
    result.executedTransaction &&
    effectiveStorageChanges(
      account.storage,
      storageChanges(result.executedTransaction),
    );
  const count = changes ? changes.values.length + changes.entries.length : 0;
  const parts = [
    result.value && `returned ${result.value}`,
    changes &&
      (count === 0 ? "no storage change" : plural(count, "storage change")),
  ].filter(Boolean);
  return `Simulated ${name}${parts.length > 0 ? `: ${parts.join(", ")}` : ""}.`;
};

// Simulates an account component's procedures on a throwaway account of the
// mock client, built from the script's package and the storage slots shown.
// Every run starts from those slots, at nonce 0: nothing is persisted.
const useSimulation = (script: Script) => {
  const { components } = useComponents();
  const { scripts } = useGlobalContext();
  const schema = script.metadata?.storage;
  const [slots, setStorageSlots] = useSimulationStorageSlots(
    script.id,
    useMemo(
      () => initialStorageSlots(script, components),
      [script, components],
    ),
  );
  const storageSlots = useMemo(
    () => shownStorageSlots(schema, slots),
    [schema, slots],
  );
  // The foreign accounts: one per `account-component` dependency whose
  // package the workspace or the web app holds.
  const needsEmbedded = script.dependencies.some(
    ({ type }) => type === "account-component",
  );
  const embedded = useEmbeddedPackages(needsEmbedded);
  const edited = useEditedStorageSlots();
  const { foreignAccounts, unresolvedForeignAccounts } = useMemo(() => {
    const resolved = foreignDependencies(script, scripts, embedded ?? []);
    const foreignAccounts: ForeignAccount[] = [];
    const unresolvedForeignAccounts: UnresolvedForeignAccount[] = [];
    for (const resolution of resolved) {
      const { name } = resolution.dependency;
      if ("reason" in resolution) {
        // Until the embedded packages are loaded, one may still resolve.
        if (embedded || resolution.reason === "stale") {
          unresolvedForeignAccounts.push({ name, reason: resolution.reason });
        }
        continue;
      }
      const key = foreignSlotsKey(script.id, name);
      const foreignSchema = resolution.script.metadata?.storage;
      foreignAccounts.push({
        name,
        dependency: resolution.dependency,
        script: resolution.script,
        storageSlots: shownStorageSlots(
          foreignSchema,
          edited.get(key) ?? initialStorageSlots(resolution.script, components),
        ),
        setStorageSlots: (storageSlots) =>
          setSimulationStorageSlots(key, storageSlots),
        schema: foreignSchema,
      });
    }
    return { foreignAccounts, unresolvedForeignAccounts };
  }, [script, scripts, embedded, edited, components]);
  const foreignAccountsStatus: ForeignAccountsStatus = {
    staged: foreignAccounts.length,
    stale: unresolvedForeignAccounts
      .filter(({ reason }) => reason === "stale")
      .map(({ name }) => name),
    missing: unresolvedForeignAccounts
      .filter(({ reason }) => reason === "missing")
      .map(({ name }) => name),
  };
  // What the `AccountId` arguments' dropdowns offer above the sandbox's
  // accounts.
  const simulatedAccounts = foreignAccounts.map(({ name }) => ({
    value: simulatedAccountValue(name),
    name,
  }));
  // The embedded packages aren't loaded yet: a dependency may still resolve.
  const foreignAccountsReady = !needsEmbedded || embedded !== undefined;
  // Resolves to the run's result and the account's state it ran from.
  const invoke = (procedureExport: ProcedureExport, args: ProcedureArguments) =>
    enqueueSimulation(async () => {
      const name = formatProcedureExportPath(procedureExport.path);
      let account: Account | undefined;
      let result: SimulationResult;
      try {
        result = await withSimulationClient(async (client) => {
          // The foreign accounts first, each committed in a block of the
          // mock chain. Not for a procedure known not to call one, unless an
          // argument names one.
          const pickedForeign = Object.values(args).some(
            (argument) =>
              argument.type === "AccountId" &&
              simulatedAccountName(argument.accountId) !== undefined,
          );
          const staged = new Map<string, Account>();
          if (procedureExport.callsForeign !== false || pickedForeign) {
            for (const foreignAccount of foreignAccounts) {
              staged.set(
                foreignAccount.name,
                await simulatedAccount(
                  client,
                  `foreign:${foreignAccount.script.commitment}:${JSON.stringify(foreignAccount.storageSlots)}`,
                  () =>
                    stageForeignAccount({
                      client,
                      script: foreignAccount.script,
                      storageSlots: foreignAccount.storageSlots,
                    }),
                ),
              );
            }
          }
          // The stand-ins of the staged accounts, replaced by their ids.
          const resolvedArgs = Object.fromEntries(
            Object.entries(args).map(([name, argument]) => {
              const foreignName =
                argument.type === "AccountId"
                  ? simulatedAccountName(argument.accountId)
                  : undefined;
              if (foreignName === undefined) {
                return [name, argument];
              }
              const foreign = staged.get(foreignName);
              if (!foreign) {
                throw new Error(
                  `The simulated account ${foreignName} is no longer a dependency of this script: pick another account.`,
                );
              }
              return [name, { ...argument, accountId: foreign.id }];
            }),
          );
          account = await simulatedAccount(
            client,
            `${script.id}:${script.commitment}:${JSON.stringify(storageSlots)}`,
            () => createSimulatedAccount({ client, script, storageSlots }),
          );
          return simulateProcedure({
            client,
            accountId: account.id,
            script,
            procedureExport,
            procedureInputs: encodeProcedureArguments({
              params: procedureParams(procedureExport),
              args: resolvedArgs,
              accountIdParts,
            }),
            foreignAccountsStaged: staged.size,
          });
        });
      } catch (error) {
        result = {
          ok: false,
          error: cleanExecutionError(
            error instanceof Error ? error.message : String(error),
          ),
        };
      }
      appendConsoleEntry(
        script.id,
        result.ok && account
          ? { level: "success", text: summary(name, result, account) }
          : {
              level: "error",
              text: `Simulation of ${name} failed.`,
              output: result.ok ? "" : result.error,
            },
      );
      return { result, account };
    });
  return {
    storageSlots,
    setStorageSlots,
    foreignAccounts,
    unresolvedForeignAccounts,
    foreignAccountsStatus,
    foreignAccountsReady,
    simulatedAccounts,
    invoke,
  };
};

export default useSimulation;
