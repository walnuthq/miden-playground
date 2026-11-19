import type { NetworkId } from "@/lib/types/network";
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

// Whether simulations can run on a throwaway account: an account component's
// procedures, and a note or transaction script on the "Simulated account".
// They run on a mock client of their own, whose store has the one name the
// SDK gives every mock client: on the MockChain sandbox that store is the
// sandbox's (lib/simulation/simulation-client.ts). There, a note or
// transaction script runs on the sandbox's accounts only, on the app's
// client, and an account component is deployed instead.
export const hasSimulatedAccounts = (networkId: NetworkId) =>
  networkId !== "mmck";
