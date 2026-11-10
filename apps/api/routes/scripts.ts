import { strToU8, zipSync } from "fflate";
import { dbMiddleware } from "@/db/middleware";
import { deletePackage, getDependenciesDeep, getPackage } from "@/db/packages";
import { createApp } from "@/lib/app";
import {
  basicWalletDependency,
  counterAccountDependency,
  defaultDependenciesRecords,
} from "@/lib/default-dependencies";
import { badRequest, errorResponse, notFound } from "@/lib/errors";
import { importExample, importScriptsFromPackageSources } from "@/lib/import";
import { exportFiles } from "@/lib/package-files";
import { toPackageType } from "@/lib/package-type";
import { rateLimit } from "@/lib/rate-limit";
import { templates } from "@/lib/templates";
import type {
  CompiledPackage,
  Dependency,
  Export,
  Package,
  PackageSource,
  ProcedureExport,
  ScriptExample,
  ScriptFiles,
} from "@/lib/types";
import { compilePackage, createPackage, scriptFiles } from "@/lib/utils";
import { isValidUUIDv4 } from "@/lib/uuid";
import {
  isBoundedArray,
  isPackageSources,
  isSource,
  isStringArray,
  isValidPackageName,
} from "@/lib/validation";

type CreateScriptRequestBody = {
  name: string;
  type: string;
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

const packageId = (id: string) => {
  if (!isValidUUIDv4(id)) {
    throw notFound("Error: Package not found.");
  }
  return id;
};

const invalidBody = () => badRequest("Error: Invalid request body.");

const scripts = createApp()
  .use(dbMiddleware)
  .post("/", rateLimit, async (c) => {
    try {
      const { name, type, example } = await c.req
        .json<CreateScriptRequestBody>()
        .catch(() => {
          throw invalidBody();
        });
      // A web app loaded before the rename can still send "tx-script".
      const packageType = toPackageType(type);
      if (!packageType) {
        return c.text(`Error: Invalid script type ${type}.`, 400);
      }
      if (!isValidPackageName(name)) {
        throw badRequest("Error: Invalid script name.");
      }
      if (!Object.hasOwn(scriptsDependencies, example)) {
        throw badRequest("Error: Invalid script example.");
      }
      const actualType =
        packageType === "authentication-component"
          ? "account-component"
          : packageType;
      const { id, files } = await createPackage({
        name,
        type: actualType,
        source: templates[example === "none" ? packageType : example],
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
      return errorResponse(c, error);
    }
  })
  .post("/import", rateLimit, async (c) => {
    try {
      const { packageSources } = await c.req
        .json<ImportScriptsRequestBody>()
        .catch(() => {
          throw invalidBody();
        });
      if (!isPackageSources(packageSources)) {
        throw invalidBody();
      }
      const packages = await importScriptsFromPackageSources(
        packageSources,
        c.req.raw.signal,
      );
      return c.json<ImportScriptsResponse>({ packages });
    } catch (error) {
      return errorResponse(c, error);
    }
  })
  .post("/examples/:exampleId", rateLimit, async (c) => {
    try {
      const packages = await importExample(
        c.req.param("exampleId"),
        c.req.raw.signal,
      );
      return c.json<ImportScriptsResponse>({ packages });
    } catch (error) {
      return errorResponse(c, error);
    }
  })
  .get("/:id", async (c) => {
    try {
      const id = packageId(c.req.param("id"));
      const dbPackage = await getPackage(id);
      if (!dbPackage) {
        throw notFound("Error: Package not found.");
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
      return errorResponse(c, error);
    }
  })
  .patch("/:id", rateLimit, async (c) => {
    try {
      const id = packageId(c.req.param("id"));
      const { files, dependencies } = await c.req
        .json<CompileScriptRequestBody>()
        .catch(() => {
          throw invalidBody();
        });
      const source = files?.["src/lib.rs"];
      if (!isSource(source)) {
        throw invalidBody();
      }
      if (
        !isBoundedArray(dependencies) ||
        !isStringArray(dependencies) ||
        !dependencies.every(
          (dependency) =>
            isValidUUIDv4(dependency) ||
            Object.hasOwn(defaultDependenciesRecords, dependency),
        )
      ) {
        throw badRequest("Error: Invalid dependencies.");
      }
      const compiledPackage = await compilePackage({
        id,
        source,
        dependencies,
        signal: c.req.raw.signal,
      });
      return c.json<CompileScriptResponse>({ package: compiledPackage });
    } catch (error) {
      return errorResponse(c, error);
    }
  })
  .delete("/:id", async (c) => {
    try {
      const id = packageId(c.req.param("id"));
      await deletePackage(id);
      return c.json<{ package: { id: string } }>({ package: { id } });
    } catch (error) {
      return errorResponse(c, error);
    }
  })
  .get("/:id/export", async (c) => {
    try {
      const id = packageId(c.req.param("id"));
      const dbPackage = await getPackage(id);
      if (!dbPackage) {
        throw notFound("Error: Package not found.");
      }
      const dependenciesPackages =
        dbPackage.dependencies.length > 0
          ? await getDependenciesDeep(dbPackage.dependencies)
          : [];
      const files = exportFiles(
        dbPackage.name,
        dbPackage.files,
        dependenciesPackages,
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
      return errorResponse(c, error);
    }
  });

export default scripts;
