// Resolves the `@/` alias of tsconfig.json for the unit tests, which run on
// plain node: `node --import ./test/alias.ts --test …`, from apps/web. Also
// gives the app's modules an empty `import.meta.env`, which Vite defines and
// node doesn't (lib/constants reads it at load, with defaults).
import { existsSync } from "node:fs";
import { registerHooks } from "node:module";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

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
  load: (url, context, nextLoad) => {
    const result = nextLoad(url, context);
    if (
      !url.startsWith("file:") ||
      !fileURLToPath(url).startsWith(root) ||
      url.includes("/node_modules/") ||
      result.source === undefined
    ) {
      return result;
    }
    const source = String(result.source);
    return source.includes("import.meta.env")
      ? {
          ...result,
          source: source.replaceAll(
            "import.meta.env",
            "(import.meta.env ?? {})",
          ),
        }
      : result;
  },
});
