import type { ReactNode } from "react";
import type { State } from "@/lib/types/state";

export type Example = {
  id: string;
  title: string;
  tagline: string;
  description: ReactNode;
  state: State;
};
