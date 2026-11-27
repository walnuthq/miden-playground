import type { Account } from "@/lib/types/account";
import type { Script, StorageSchema } from "@/lib/types/script";
import type { StorageSlot } from "@/lib/types/storage-slot";
import { initialSlotsOf, mergeStorageSlots } from "@/lib/utils/storage-schema";

const NO_SLOTS: StorageSlot[] = [];

// The simulated accounts of each mock client, by package and storage: an
// account's id depends on its storage, so each edit is a new one. A client
// that crashed is replaced by a new one, with an empty store.
const simulatedAccountsByClient = new WeakMap<
  object,
  Map<string, Promise<Account>>
>();

export const simulatedAccount = (
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
// storage schema, at their defaults. Without one, the names its source
// declares, as values at zero whose type the user sets; and none when it
// declares none: the user adds them.
export const initialStorageSlots = (script: Script) =>
  initialSlotsOf(script.metadata) ?? NO_SLOTS;

// The slots shown: the user's edits over the initial ones. A recompile can
// change the schema: the edits of the slots it still has stay, the others go.
export const shownStorageSlots = (
  schema: StorageSchema | undefined,
  slots: StorageSlot[],
) => (schema ? mergeStorageSlots(schema, slots) : slots);
