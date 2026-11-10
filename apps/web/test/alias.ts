// Resolves the `@/` alias of tsconfig.json for the unit tests, which run on
// plain node: `node --import ./test/alias.ts --test …`, from apps/web.
import { existsSync } from "node:fs";
import { registerHooks } from "node:module";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const root = join(import.meta.dirname, "..");

registerHooks({
  resolve: (specifier, context, nextResolve) => {
    if (specifier.startsWith("@/")) {
      const base = join(root, specifier.slice(2));
      const file = [`${base}.ts`, join(base, "index.ts")].find(existsSync);
      if (file) {
        return nextResolve(pathToFileURL(file).href, context);
      }
    }
    return nextResolve(specifier, context);
  },
});
