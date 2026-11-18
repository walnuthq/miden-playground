// An account component is a script of type `account-component` or
// `authentication-component`: the built-ins assembled from MASM, and the
// packages the user compiles or imports. Its storage layout is the script's
// storage schema (`metadata.storage`). No SDK import. Not in script.ts: the
// built-in scripts import that module, and this one imports them.
import type { StorageItem } from "@/lib/types/account";
import defaultScripts, { defaultScriptIds } from "@/lib/types/default-scripts";
import type { Script } from "@/lib/types/script";
import type { StorageSlotType } from "@/lib/types/storage-slot";
import { storageSlotPrefix } from "@/lib/utils/storage-slots";

// The built-in components' titles, in the order the Deploy dialog lists them.
// Every other component goes by its script's name.
const builtInComponentTitles: Record<string, string> = {
  "auth-no-auth": "No Auth",
  "auth-single-sig": "Single Sig",
  "auth-guarded-multisig": "Guarded Multisig",
  "auth-network-account": "Network Account",
  "basic-wallet": "Basic Wallet",
  "fungible-faucet": "Fungible Faucet",
};

const builtInOrder = Object.keys(builtInComponentTitles);

// A script the code defines (lib/types/default-scripts), or a retired one's
// persisted copy.
export const isBuiltInScript = ({ id }: Pick<Script, "id">) =>
  defaultScriptIds.includes(id);

export const componentTitle = ({ id, name }: Pick<Script, "id" | "name">) =>
  builtInComponentTitles[id] ?? name;

const isCompiledPackage = ({ status, masp }: Script) =>
  status === "compiled" && masp !== "";

// The account components an account can be deployed with: the user's
// compiled packages (the built-in wallet and faucet come with their own
// dialogs).
export const deployableAccountComponents = (scripts: Script[]) =>
  scripts.filter(
    (script) =>
      script.type === "account-component" &&
      isCompiledPackage(script) &&
      !isBuiltInScript(script),
  );

// The authentication components an account can be deployed with: the
// built-in ones, then the user's compiled packages.
export const authComponents = (scripts: Script[]) => [
  ...defaultScripts
    .filter(({ type }) => type === "authentication-component")
    .toSorted(
      (a, b) => builtInOrder.indexOf(a.id) - builtInOrder.indexOf(b.id),
    ),
  ...scripts.filter(
    (script) =>
      script.type === "authentication-component" &&
      isCompiledPackage(script) &&
      !isBuiltInScript(script),
  ),
];

// The slots of an account's storage that belong to a component: those its
// script's schema declares, else (a package compiled or verified before
// schemas existed) those named with its package's prefix, as the compiler
// names them (`storageSlotName`).
export const componentStorageSlots = (
  { name, metadata }: Pick<Script, "name" | "metadata">,
  storage: StorageItem[],
): { name: string; type: StorageSlotType }[] =>
  metadata?.storage
    ? metadata.storage.slots.map(({ name, type }) => ({ name, type }))
    : storage
        .filter((item) => item.name.startsWith(storageSlotPrefix(name)))
        .map(({ name, type }) => ({ name, type }));
