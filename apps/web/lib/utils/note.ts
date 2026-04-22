import type { InputNote } from "@/lib/types/note";

export const defaultInputNote = (): InputNote => ({
  id: "",
  type: "public",
  state: "committed",
  tag: "",
  serialNum: "",
  senderId: "",
  scriptRoot: "",
  scriptId: "",
  fungibleAssets: [],
  storage: [],
  nullifier: "",
  updatedAt: Date.now(),
});

export const noteConsumed = ({ state }: InputNote) =>
  state.includes("consumed");
