import type { Script } from "@/lib/types/script";

// The packages the web app embeds, which an account component's dependency
// can resolve to when the workspace doesn't hold it (foreignDependencies).
// None since the switch to MASM: the Rust counter and basic wallet were
// deleted, and plan 07 of spec/remove-rust re-embeds the counter from MASM
// or assembles it on demand. Their masp is large: load this module with a
// dynamic import(), never from the script page's static graph.
export const embeddedPackages: Script[] = [];
