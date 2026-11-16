import { basicWalletScript } from "@/lib/tutorials/basic-wallet";
import { counterAccountScript } from "@/lib/tutorials/counter-account";

// The packages the web app embeds, which an account component's dependency
// can resolve to when the workspace doesn't hold it (foreignDependencies):
// the API's built-in `counter-account` dependency has the embedded counter's
// commitment. Their masp is large: load this module with a dynamic import(),
// never from the script page's static graph.
export const embeddedPackages = [counterAccountScript, basicWalletScript];
