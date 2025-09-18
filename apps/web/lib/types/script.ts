export const scriptTypes = {
  account: "Account Script",
  transaction: "Transaction Script",
  note: "Note Script",
} as const;

export type ScriptType = keyof typeof scriptTypes;

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
