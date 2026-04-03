import type { ReactNode } from "react";
import type { State } from "@/lib/types/state";
import type { ProcedureExport } from "@/lib/types/script";

export type Example = {
  id: string;
  title: string;
  tagline: string;
  description: ReactNode;
  githubRepoUrl: string;
  projectDir?: string;
  state: State;
  procedureExports: ProcedureExport[];
};
