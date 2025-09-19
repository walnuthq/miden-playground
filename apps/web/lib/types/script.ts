export const scriptTypes = {
  account: "Account Script",
  note: "Note Script",
  // transaction: "Transaction Script",
} as const;

export type ScriptType = keyof typeof scriptTypes;

export type ScriptExampleItem = {
  name: string;
  type: ScriptType;
};

export const scriptExamples = {
  "counter-contract": { name: "Counter Contract", type: "account" },
  "counter-note": { name: "Counter Note", type: "note" },
} as const;

export type ScriptExample = keyof typeof scriptExamples;

export const scriptStatuses = {
  draft: "Draft",
  compiled: "Compiled",
} as const;

export type ScriptStatus = keyof typeof scriptStatuses;

export type Script = {
  id: string;
  name: string;
  type: ScriptType;
  status: ScriptStatus;
  rust: string;
  masm: string;
  error: string;
  root: string;
  updatedAt: number;
};
