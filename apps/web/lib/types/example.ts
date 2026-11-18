import type { ReactNode } from "react";
import type { State } from "@/lib/types/state";

export type ExampleId = "counter-account" | "bank-account";

// What the home page and the project switcher show of an example
// (lib/examples/meta.tsx): the app shell renders them before the SDK loads,
// which the examples' states need.
export type ExampleMeta = {
  id: ExampleId;
  title: string;
  tagline: string;
  description: ReactNode;
};

export type Example = ExampleMeta & {
  state: State;
  // The name of the account launching the example deploys, from the script
  // named after the example's id (useExamples).
  accountName: string;
};
