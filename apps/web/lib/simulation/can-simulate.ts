import type { Script } from "@/lib/types/script";

// Whether the script page offers the console's Simulate tab on a read-only
// script (an editable script always has its console): an account component, a
// note or a transaction script that holds a compiled package. The built-ins
// assembled from MASM have none, and libraries and authentication components
// aren't simulated. SDK-free: the script page imports it.
export const canSimulate = ({ type, masp }: Pick<Script, "type" | "masp">) =>
  (type === "account-component" ||
    type === "note" ||
    type === "transaction-script") &&
  masp !== "";
