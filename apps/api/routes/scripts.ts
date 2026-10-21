import { strToU8, zipSync } from "fflate";
import { dbMiddleware } from "@/db/middleware";
import { deletePackage, getDependencies, getPackage } from "@/db/packages";
import { createApp } from "@/lib/app";
import {
  basicWalletDependency,
  counterAccountDependency,
} from "@/lib/default-dependencies";
import {
  importScriptsFromGithubRepo,
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
} from "@/lib/types";
import { upstreamErrorResponse } from "@/lib/upstream";
import { compilePackage, createPackage } from "@/lib/utils";

type CreateScriptRequestBody = {
  name: string;
  type: PackageType;
  example: ScriptExample;
};

type CreateScriptResponse = {
  package: Pick<Package, "id" | "name" | "type" | "rust"> & {
    dependencies: Dependency[];
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
  package: Omit<Package, "createdAt" | "updatedAt"> & {
    procedureExports: ProcedureExport[];
    createdAt: number;
    updatedAt: number;
  };
};

type CompileScriptRequestBody = {
  name: string;
  rust: string;
  dependencies: string[];
};

type CompileScriptResponse = { package: CompiledPackage };

type ImportScriptsRequestBody = {
  packageSources?: Record<string, PackageSource>;
  githubRepoUrl?: string;
  projectDir?: string;
  ref?: string;
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
      const rust = templates[example === "none" ? type : example];
      const packageId = await createPackage({
        name,
        type: actualType,
        rust,
        dependencies: scriptsDependencies[example],
      });
      return c.json<CreateScriptResponse>({
        package: {
          id: packageId,
          name,
          type: actualType,
          rust,
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
      const { packageSources, githubRepoUrl, projectDir, ref } =
        await c.req.json<ImportScriptsRequestBody>();
      if (packageSources) {
        const packages = await importScriptsFromPackageSources(
          packageSources,
          c.req.raw.signal,
        );
        return c.json<ImportScriptsResponse>({ packages });
      }
      if (githubRepoUrl) {
        if (!githubRepoUrl.startsWith("https://github.com/0xMiden/")) {
          throw new Error("Error: Invalid GitHub repository URL.");
        }
        if (ref !== undefined && !/^\w[\w./-]*$/.test(ref)) {
          throw new Error("Error: Invalid Git ref.");
        }
        const packages = await importScriptsFromGithubRepo({
          githubRepoUrl,
          projectDir,
          ref,
          signal: c.req.raw.signal,
        });
        return c.json<ImportScriptsResponse>({ packages });
      }
      throw new Error("Error: Invalid request body.");
    } catch (error) {
      console.error(error);
      const { message } = error as { message: string };
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
      const { rust, dependencies } =
        await c.req.json<CompileScriptRequestBody>();
      const compiledPackage = await compilePackage({
        id,
        rust,
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
