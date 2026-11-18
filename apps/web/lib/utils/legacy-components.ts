// Components were an entity of their own until spec/remove-components.md: a
// name, a script and storage slots the user typed. An account's `components`
// held their ids. Now an account component is its script, and its storage
// layout is the script's storage schema. States persisted, saved in a project
// or snapshotted for a resumable tutorial before then carry a `components`
// key, and `stateDeserializer` passes them through `migrateLegacyComponents`
// once: the new serializer never writes the key, so it never runs again.
// No SDK import: the unit tests run on plain node.

import type { TutorialProgress } from "../types/project.ts";
import type { PackageMetadata, StorageSlotSchema } from "../types/script.ts";
import type { StorageSlot } from "../types/storage-slot.ts";
import { isWordText, wordFelts, wordTextToHex } from "./storage-slots.ts";

export type LegacyComponent = {
  id: string;
  name: string;
  type: "account-component" | "authentication-component";
  scriptId: string;
  storageSlots: StorageSlot[];
  updatedAt: number;
};

// The built-in components' ids, each its script's id, and the MASM counter's
// (retired before components were removed). Their scripts' schemas come from
// the code (lib/types/default-scripts), not from these slots.
const builtInComponentIds = [
  "auth-no-auth",
  "auth-network-account",
  "auth-single-sig",
  "auth-guarded-multisig",
  "basic-wallet",
  "fungible-faucet",
  "counter-contract",
];

// Tutorial 7 lost a step: its old steps 3 and 4 (indexes 2 and 3, creating
// the component and adding its slot) became one, so both land on index 2.
const SHIFTED_TUTORIAL_ID = "deploy-a-counter-contract";
const REMOVED_STEP_INDEX = 3;

const shiftedStep = (step: number) =>
  step >= REMOVED_STEP_INDEX ? step - 1 : step;

const slotSchema = ({ name, type, value }: StorageSlot): StorageSlotSchema => {
  if (type === "map") {
    // A schema has no default entries: the map starts empty.
    return { name, type, keyType: "word", valueType: "word" };
  }
  const isZero =
    !isWordText(value) || wordFelts(value).every((felt) => felt === 0n);
  return {
    name,
    type,
    valueType: "word",
    ...(!isZero && { defaultValue: wordTextToHex(value) }),
  };
};

type MigratedScript = { id: string; metadata?: PackageMetadata | null };

type LegacyState = {
  accounts?: { components: string[] }[];
  scripts?: MigratedScript[];
  components?: LegacyComponent[];
  tutorialId?: string;
  tutorialStep?: number;
  tutorialMaxStep?: number;
  tutorialProgress?: Partial<Record<string, TutorialProgress>>;
};

// The parsed state without `components`: each account's component ids turned
// into their scripts' ids (an unknown id is left as it is), a schema for each
// workspace script that had a custom component and no schema (from the first
// such component's slots: the next compile replaces it with the real one),
// and tutorial 7's step indexes shifted to its new steps. A state without the
// key is returned as it is.
export const migrateLegacyComponents = <T extends LegacyState>({
  components,
  ...state
}: T): Omit<T, "components"> => {
  if (!components) {
    return state;
  }
  const scriptIds = new Map(
    components.map(({ id, scriptId }) => [id, scriptId]),
  );
  const schemas = new Map<string, StorageSlotSchema[]>();
  for (const { id, scriptId, storageSlots } of components) {
    if (!builtInComponentIds.includes(id) && !schemas.has(scriptId)) {
      schemas.set(scriptId, storageSlots.map(slotSchema));
    }
  }
  const isTutorial7 = state.tutorialId === SHIFTED_TUTORIAL_ID;
  const progress = state.tutorialProgress?.[SHIFTED_TUTORIAL_ID];
  const migrated: LegacyState = {
    ...state,
    ...(state.accounts && {
      accounts: state.accounts.map((account) => ({
        ...account,
        components: [
          ...new Set(account.components.map((id) => scriptIds.get(id) ?? id)),
        ],
      })),
    }),
    ...(state.scripts && {
      scripts: state.scripts.map((script) => {
        const slots = schemas.get(script.id);
        return slots && !script.metadata?.storage
          ? { ...script, metadata: { ...script.metadata, storage: { slots } } }
          : script;
      }),
    }),
    ...(isTutorial7 &&
      state.tutorialStep !== undefined && {
        tutorialStep: shiftedStep(state.tutorialStep),
      }),
    ...(isTutorial7 &&
      state.tutorialMaxStep !== undefined && {
        tutorialMaxStep: shiftedStep(state.tutorialMaxStep),
      }),
    ...(progress && {
      tutorialProgress: {
        ...state.tutorialProgress,
        [SHIFTED_TUTORIAL_ID]: {
          ...progress,
          step: shiftedStep(progress.step),
          maxStep: shiftedStep(progress.maxStep),
        },
      },
    }),
  };
  return migrated as Omit<T, "components">;
};
