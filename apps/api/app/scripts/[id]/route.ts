import { type NextRequest, NextResponse } from "next/server";
import {
  compilePackage,
  deletePackageDir,
  packageExists,
  readPackage,
  generatePackageDir,
  generateCargoToml,
  updateRust,
} from "@/lib/miden-compiler";
import {
  type CompiledPackage,
  type Package,
  type ProcedureExport,
  type Export,
} from "@/lib/types";
import {
  getDependencies,
  getPackage,
  updatePackage,
  deletePackage,
} from "@/db/packages";

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
    const [exists, dbPackage, dependenciesPackages] = await Promise.all([
      packageExists(id),
      getPackage(id),
      getDependencies(updatedDependencies),
    ]);
    if (!dbPackage) {
      throw new Error("Error: Package not found");
    }
    const { name, type } = dbPackage;
    if (exists) {
      await updateRust({ packageDir: id, name, rust: updatedRust });
    } else {
      await generatePackageDir({
        packageDir: id,
        name,
        type,
        rust: updatedRust,
        dependencies: updatedDependencies,
      });
    }
    await generateCargoToml({
      packageDir: id,
      name,
      type,
      dependencies: dependenciesPackages,
    });
    const { stderr } = await compilePackage({ packageDir: id, name });
    if (stderr) {
      console.error(stderr);
      await updatePackage({
        id,
        status: "error",
        rust: updatedRust,
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
    const {
      masp,
      digest,
      exports,
      dependencies: compiledDependencies,
    } = await readPackage(id);
    await updatePackage({
      id,
      status: "compiled",
      rust: updatedRust,
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
          const dependency = compiledDependencies.find(
            ({ id }) => id === dependencyPackage.id,
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
    await Promise.all([deletePackage(id), deletePackageDir(id)]);
    return NextResponse.json<{ package: { id: string } }>({ package: { id } });
  } catch (error) {
    console.error(error);
    const { message } = error as { message: string };
    return new NextResponse(message, { status: 500 });
  }
};
