import type { ReactNode } from "react";
import type { State } from "@/lib/types/state";

export type Example = {
  id: string;
  title: string;
  tagline: string;
  description: ReactNode;
  githubRepoUrl: string;
  // Commit, branch or tag to import, so the example doesn't change under us.
  githubRepoRef?: string;
  projectDir?: string;
  state: State;
};
