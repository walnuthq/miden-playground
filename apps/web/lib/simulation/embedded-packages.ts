import type { Script } from "@/lib/types/script";

// The packages the web app embeds, which an account component's dependency
// can resolve to when the workspace doesn't hold it (foreignDependencies).
// None since the switch to MASM: the Rust counter and basic wallet were
// deleted, and the tutorials that need the counter have the API assemble it
// when they start (Tutorial.starter), so a workspace script resolves it. An
// embedded masp is large: load this module with a dynamic import(), never
// from the script page's static graph.
export const embeddedPackages: Script[] = [];
