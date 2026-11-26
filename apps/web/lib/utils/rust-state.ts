import { defaultScriptIds } from "@/lib/types/default-scripts";
import type { State } from "@/lib/types/state";
import { defaultState, stateDeserializer } from "@/lib/utils/state";

// A state persisted before the switch to MASM (spec/remove-rust.md, decision
// 13) can hold a Rust script, which can't be compiled any more, and accounts
// deployed from it. Such a state is reset whole, without telling the user:
// the active workspace starts over as a new sandbox on its network, and a
// saved project or a tutorial's saved progress is deleted (with a MockChain
// project's chain, which its record holds). A state with no Rust script is
// left alone.

type PersistedScript = {
  id?: unknown;
  // Where scripts persisted before `files` kept their Rust source.
  rust?: unknown;
  files?: unknown;
};

const isRustFile = (path: string) =>
  path.endsWith(".rs") || path === "Cargo.toml" || path.endsWith("/Cargo.toml");

// A Rust script has a Rust source (`src/lib.rs`) or a `Cargo.toml` among its
// files, or its source in the legacy `rust` field. Built-ins never are: the
// code's copy replaces the persisted one.
export const isRustScript = ({ id, rust, files }: PersistedScript) => {
  if (typeof id === "string" && defaultScriptIds.includes(id)) {
    return false;
  }
  if (typeof rust === "string" && rust !== "") {
    return true;
  }
  return (
    typeof files === "object" &&
    files !== null &&
    Object.keys(files).some(isRustFile)
  );
};

// Whether a serialized app state (`stateSerializer`'s output) holds a Rust
// script. A state that doesn't parse holds none: `stateDeserializer` turns it
// into the default state anyway.
export const holdsRustScript = (serializedState: string) => {
  try {
    const { scripts } = JSON.parse(serializedState) as { scripts?: unknown };
    return (
      Array.isArray(scripts) &&
      scripts.some(
        (script) =>
          typeof script === "object" &&
          script !== null &&
          isRustScript(script as PersistedScript),
      )
    );
  } catch {
    return false;
  }
};

// The active workspace read from storage held a Rust script, so it starts as
// the default state: set by the global context's initializer, which runs
// before the client exists. The sandbox it becomes (its network's faucet, a
// cleared store, a new mock chain) is queued from the SDK side, which takes
// it once (`takeWorkspaceReset`, components/lib/network-badge.tsx).
let workspaceResetPending = false;
// Stays set for the page's life: until the reset's sandbox is switched to
// (the first workspace run), nothing is persisted, or the empty state shown
// meanwhile would replace the Rust one in storage, and the next load would
// keep the old store without resetting it.
let workspaceResetAtLoad = false;

export const markWorkspaceReset = () => {
  workspaceResetPending = true;
  workspaceResetAtLoad = true;
};

export const resettingWorkspace = (workspaceRun: number) =>
  workspaceResetAtLoad && workspaceRun === 0;

export const takeWorkspaceReset = () => {
  const pending = workspaceResetPending;
  workspaceResetPending = false;
  return pending;
};

// The active workspace from its persisted state (null: none). One holding a
// Rust script is reset: only what outlives a workspace is kept, the completed
// tutorials and the progress of those left unfinished, and the new sandbox is
// queued once the client is up (`takeWorkspaceReset`). Until its store is
// imported, storage keeps the old state, so a reload resets it again.
export const persistedWorkspace = (value: string | null): State => {
  if (value === null) {
    return defaultState();
  }
  const state = stateDeserializer(value);
  if (!holdsRustScript(value)) {
    return state;
  }
  markWorkspaceReset();
  return {
    ...defaultState(),
    completedTutorials: state.completedTutorials,
    tutorialProgress: state.tutorialProgress,
  };
};
