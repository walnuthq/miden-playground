import type { NetworkId } from "@/lib/types/network";

// What a project snapshot was taken of: a tutorial left unfinished, saved to
// resume it, or a project the user saved from the sidebar (a sandbox or an
// example, which saving turns into a project).
export type ProjectKind = "tutorial" | "project";

// A saved project: the app state and the client store it describes, enough to
// restore both later (see `lib/utils/project.ts`).
export type Project = {
  version: 1;
  kind: ProjectKind;
  id: string;
  // The name the user gave it (tutorials pass their id: they're never listed).
  name: string;
  networkId: NetworkId;
  savedAt: number;
  // `stateSerializer(state)`.
  state: string;
  // The client store as `exportStore()` dumps it (JSON, the `Store` type).
  store: string;
};

// What the projects list shows of a project, kept apart from the snapshot
// (whose store dump weighs megabytes) so listing never reads it.
export type ProjectMeta = Pick<
  Project,
  "kind" | "id" | "name" | "networkId" | "savedAt"
>;

// A tutorial left unfinished, kept in the app state so the UI can show it
// without reading the saved projects.
export type TutorialProgress = {
  step: number;
  maxStep: number;
  savedAt: number;
};
