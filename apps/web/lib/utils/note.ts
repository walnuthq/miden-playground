import type { InputNote } from "@/lib/types/note";

// Unused at the moment.
// export const defaultInputNote = (): InputNote => ({
//   id: "",
//   type: "public",
//   state: "committed",
//   tag: "",
//   serialNum: "",
//   senderId: "",
//   scriptRoot: "",
//   scriptId: "",
//   fungibleAssets: [],
//   storage: [],
//   nullifier: "",
//   blockNum: 0,
//   noteFileBytes: "",
//   updatedAt: Date.now(),
// });

export const noteConsumed = ({ state }: InputNote) =>
  state.includes("consumed") || state === "expected";
