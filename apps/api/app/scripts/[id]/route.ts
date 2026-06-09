import { type NextRequest, NextResponse } from "next/server";
import type {
  CompiledPackage,
  Package,
  ProcedureExport,
  Export,
  Manifest,
} from "@/lib/types";
import {
  getDependencies,
  getPackage,
  updatePackage,
  deletePackage,
} from "@/db/packages";
import { API_COMPILE_URL } from "@/lib/constants";
import { generateCargoToml } from "@/lib/utils";

type GetScriptResponse = {
  package: Omit<Package, "createdAt" | "updatedAt"> & {
    procedureExports: ProcedureExport[];
    createdAt: number;
    updatedAt: number;
  };
};

export const GET = async (
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    const { id } = await params;
    const dbPackage = await getPackage(id);
    if (!dbPackage) {
      throw new Error("Error: Package not found.");
    }
    const exports = dbPackage.exports as Export[];
    return NextResponse.json<GetScriptResponse>({
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
    return new NextResponse(message, { status: 500 });
  }
};

type CompileScriptRequestBody = {
  name: string;
  rust: string;
  dependencies: string[];
};

type CompileScriptResponse = { package: CompiledPackage };

export const PATCH = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    const { id } = await params;
    const body = await request.json();
    const { rust: updatedRust, dependencies: updatedDependencies } =
      body as CompileScriptRequestBody;
    const [dbPackage, dependenciesPackages] = await Promise.all([
      getPackage(id),
      getDependencies(updatedDependencies),
    ]);
    if (!dbPackage) {
      throw new Error("Error: Package not found");
    }
    const { name, type } = dbPackage;
    const updatedFiles = dbPackage.files;
    updatedFiles[`${name}/src/lib.rs`] = updatedRust;
    updatedFiles[`${name}/Cargo.toml`] = generateCargoToml({
      name,
      type,
      dependencies: dependenciesPackages,
    });
    const files = dependenciesPackages.reduce<Record<string, string>>(
      (previousValue, currentValue) => {
        for (const [path, content] of Object.entries(currentValue.files)) {
          previousValue[path] = content;
        }
        return previousValue;
      },
      updatedFiles,
    );
    const response = await fetch(`${API_COMPILE_URL}/compile`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        files,
        entrypoint: name,
      }),
    });
    const result = await response.json();
    if (!response.ok) {
      const { error } = result as { error: string };
      throw new Error(error);
    }
    const { stdout, stderr } = result as { stdout: string; stderr: string };
    if (stdout === "" && stderr !== "") {
      console.error(stderr);
      await updatePackage({
        id,
        status: "error",
        rust: updatedRust,
        files: updatedFiles,
        dependencies: updatedDependencies,
        exports: [],
      });
      return NextResponse.json<CompileScriptResponse>({
        package: {
          id,
          name,
          type,
          status: "error",
          rust: updatedRust,
          error: stderr,
          masm: "",
          digest: "",
          masp: "",
          exports: [],
          dependencies: dependenciesPackages.map(
            ({ id, name, type, digest }) => ({
              id,
              name,
              type,
              digest,
            }),
          ),
        },
      });
    }
    const { masp, digest, manifest } = result as {
      masp: string;
      digest: string;
      manifest: Manifest;
    };
    const exports = manifest.exports.filter(
      ({ Procedure: { signature } }) => signature?.abi === 3,
    );
    await updatePackage({
      id,
      status: "compiled",
      rust: updatedRust,
      files: updatedFiles,
      masp,
      digest,
      exports,
      dependencies: updatedDependencies,
    });
    return NextResponse.json<CompileScriptResponse>({
      package: {
        id,
        name,
        type,
        status: "compiled",
        rust: updatedRust,
        error: "",
        masm: "",
        digest,
        masp,
        exports,
        dependencies: dependenciesPackages.map((dependencyPackage) => {
          const dependency = manifest.dependencies.find(
            ({ name }) => name.replaceAll("_", "-") === dependencyPackage.name,
          );
          return {
            id: dependencyPackage.id,
            name: dependencyPackage.name,
            type: dependencyPackage.type,
            digest: dependency?.digest ?? "",
          };
        }),
      },
    });
  } catch (error) {
    console.error(error);
    const { message } = error as { message: string };
    return new NextResponse(message, { status: 500 });
  }
};

export const DELETE = async (
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    const { id } = await params;
    await deletePackage(id);
    return NextResponse.json<{ package: { id: string } }>({ package: { id } });
  } catch (error) {
    console.error(error);
    const { message } = error as { message: string };
    return new NextResponse(message, { status: 500 });
  }
};
