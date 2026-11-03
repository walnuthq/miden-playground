import { strToU8, zipSync } from "fflate";
import { dbMiddleware } from "@/db/middleware";
import { deletePackage, getDependencies, getPackage } from "@/db/packages";
import { createApp } from "@/lib/app";
import {
  basicWalletDependency,
  counterAccountDependency,
} from "@/lib/default-dependencies";
import {
  ExampleNotFoundError,
  importExample,
  importScriptsFromPackageSources,
} from "@/lib/import";
import { templates } from "@/lib/templates";
import type {
  CompiledPackage,
  Dependency,
  Export,
  Package,
  PackageSource,
  PackageType,
  ProcedureExport,
  ScriptExample,
  ScriptFiles,
} from "@/lib/types";
import { upstreamErrorResponse } from "@/lib/upstream";
import { compilePackage, createPackage, scriptFiles } from "@/lib/utils";

type CreateScriptRequestBody = {
  name: string;
  type: PackageType;
  example: ScriptExample;
};

type CreateScriptResponse = {
  package: Pick<Package, "id" | "name" | "type"> & {
    dependencies: Dependency[];
    files: ScriptFiles;
  };
};

const scriptsDependencies: Record<ScriptExample, Dependency[]> = {
  none: [],
  "p2id-note": [basicWalletDependency],
  "auth-no-auth": [],
  "counter-account": [],
  "counter-note": [],
  "counter-script": [],
  "count-reader": [counterAccountDependency],
} as const;

type GetScriptResponse = {
  package: Omit<Package, "files" | "createdAt" | "updatedAt"> & {
    files: ScriptFiles;
    procedureExports: ProcedureExport[];
    createdAt: number;
    updatedAt: number;
  };
};

type CompileScriptRequestBody = {
  // The edited files: `src/lib.rs` only, the manifests are generated.
  files?: ScriptFiles;
  dependencies: string[];
};

type CompileScriptResponse = { package: CompiledPackage };

type ImportScriptsRequestBody = {
  packageSources: Record<string, PackageSource>;
};

type ImportScriptsResponse = {
  packages: CompiledPackage[];
};

const scripts = createApp()
  .use(dbMiddleware)
  .post("/", async (c) => {
    try {
      const { name, type, example } =
        await c.req.json<CreateScriptRequestBody>();
      const actualType =
        type === "authentication-component" ? "account-component" : type;
      const { id, files } = await createPackage({
        name,
        type: actualType,
        source: templates[example === "none" ? type : example],
        dependencies: scriptsDependencies[example],
      });
      return c.json<CreateScriptResponse>({
        package: {
          id,
          name,
          type: actualType,
          files,
          dependencies: scriptsDependencies[example],
        },
      });
    } catch (error) {
      console.error(error);
      const { message } = error as { message: string };
      return c.text(message, 500);
    }
  })
  .post("/import", async (c) => {
    try {
      const { packageSources } = await c.req.json<ImportScriptsRequestBody>();
      if (!packageSources) {
        throw new Error("Error: Invalid request body.");
      }
      const packages = await importScriptsFromPackageSources(
        packageSources,
        c.req.raw.signal,
      );
      return c.json<ImportScriptsResponse>({ packages });
    } catch (error) {
      console.error(error);
      const { message } = error as { message: string };
      return upstreamErrorResponse(error) ?? c.text(message, 500);
    }
  })
  .post("/examples/:exampleId", async (c) => {
    try {
      const packages = await importExample(
        c.req.param("exampleId"),
        c.req.raw.signal,
      );
      return c.json<ImportScriptsResponse>({ packages });
    } catch (error) {
      console.error(error);
      const { message } = error as { message: string };
      if (error instanceof ExampleNotFoundError) {
        return c.text(message, 404);
      }
      return upstreamErrorResponse(error) ?? c.text(message, 500);
    }
  })
  .get("/:id", async (c) => {
    try {
      const id = c.req.param("id");
      const dbPackage = await getPackage(id);
      if (!dbPackage) {
        throw new Error("Error: Package not found.");
      }
      const exports = dbPackage.exports as Export[];
      return c.json<GetScriptResponse>({
        package: {
          ...dbPackage,
          files: scriptFiles(dbPackage.name, dbPackage.files),
          procedureExports: exports.map(
            (manifestExport) => manifestExport.Procedure,
          ),
          exports,
          createdAt: dbPackage.createdAt.getTime(),
          updatedAt: dbPackage.updatedAt.getTime(),
        },
      });
    } catch (error) {
      console.error(error);
      const { message } = error as { message: string };
      return c.text(message, 500);
    }
  })
  .patch("/:id", async (c) => {
    try {
      const id = c.req.param("id");
      const { files, dependencies } =
        await c.req.json<CompileScriptRequestBody>();
      const source = files?.["src/lib.rs"];
      if (source === undefined) {
        throw new Error("Error: Invalid request body.");
      }
      const compiledPackage = await compilePackage({
        id,
        source,
        dependencies,
        signal: c.req.raw.signal,
      });
      return c.json<CompileScriptResponse>({ package: compiledPackage });
    } catch (error) {
      console.error(error);
      const { message } = error as { message: string };
      return upstreamErrorResponse(error) ?? c.text(message, 500);
    }
  })
  .delete("/:id", async (c) => {
    try {
      const id = c.req.param("id");
      await deletePackage(id);
      return c.json<{ package: { id: string } }>({ package: { id } });
    } catch (error) {
      console.error(error);
      const { message } = error as { message: string };
      return c.text(message, 500);
    }
  })
  .get("/:id/export", async (c) => {
    try {
      const id = c.req.param("id");
      const dbPackage = await getPackage(id);
      if (!dbPackage) {
        throw new Error("Error: Package not found");
      }
      const dependenciesPackages =
        dbPackage.dependencies.length > 0
          ? await getDependencies(dbPackage.dependencies)
          : [];
      const files =
        dbPackage.dependencies.length > 0
          ? dependenciesPackages.reduce<Record<string, string>>(
              (previousValue, currentValue) => {
                for (const [path, content] of Object.entries(
                  currentValue.files,
                )) {
                  previousValue[path] = content;
                }
                return previousValue;
              },
              dbPackage.files,
            )
          : Object.entries(dbPackage.files).reduce<Record<string, string>>(
              (previousValue, [path, content]) => {
                const strippedPath = path.split("/").slice(1).join("/");
                previousValue[strippedPath] = content;
                return previousValue;
              },
              {},
            );
      const zip = zipSync(
        Object.fromEntries(
          Object.entries(files).map(([path, content]) => [
            path,
            strToU8(content),
          ]),
        ),
        { level: 9 },
      );
      return c.body(zip, 200, {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${dbPackage.name}.zip"`,
      });
    } catch (error) {
      console.error(error);
      return c.text("Error exporting script", 500);
    }
  });

export default scripts;
