import type { NetworkId } from "@/lib/types/network";

// What a project snapshot was taken of. Only tutorials are saved for now; the
// other kinds are reserved for the save/load projects feature.
export type ProjectKind = "tutorial" | "sandbox" | "example";

// A saved project: the app state and the client store it describes, enough to
// restore both later (see `lib/utils/project.ts`).
export type Project = {
  version: 1;
  kind: ProjectKind;
  id: string;
  networkId: NetworkId;
  savedAt: number;
  // `stateSerializer(state)`.
  state: string;
  // The client store as `exportStore()` dumps it (JSON, the `Store` type).
  store: string;
};

// A tutorial left unfinished, kept in the app state so the UI can show it
// without reading the saved projects.
export type TutorialProgress = {
  step: number;
  maxStep: number;
  savedAt: number;
};
