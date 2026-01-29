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
import { type Export, type Dependency } from "@/lib/types";
import {
  getDependencies,
  getPackage,
  updatePackage,
  deletePackage,
} from "@/db/packages";

export const GET = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    const { id } = await params;
    const dbPackage = await getPackage(id);
    if (!dbPackage) {
      throw new Error("Error: Package not found.");
    }
    return NextResponse.json({
      ok: true,
      script: {
        ...dbPackage,
        createdAt: dbPackage.createdAt.getTime(),
        updatedAt: dbPackage.updatedAt.getTime(),
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false });
  }
};

type CompileScriptRequestBody = {
  rust: string;
  dependencies: string[];
};

type CompileScriptResponse = {
  ok: boolean;
  error: string;
  masm: string;
  digest: string;
  package: { type: "Buffer"; data: number[] };
  exports: Export[];
  dependencies: Dependency[];
};

const compileScriptResponseError = ({
  error,
  dependencies,
}: {
  error: string;
  dependencies: Dependency[];
}): CompileScriptResponse => ({
  ok: false,
  error,
  masm: "",
  digest: "",
  package: { type: "Buffer", data: [] },
  exports: [],
  dependencies,
});

export const PATCH = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
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
    await updateRust({ packageDir: id, rust: updatedRust });
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
  const { stderr } = await compilePackage(id);
  if (stderr) {
    console.error(stderr);
    await updatePackage({
      id,
      status: "error",
      rust: updatedRust,
      dependencies: updatedDependencies,
      exports: [],
    });
    return NextResponse.json(
      compileScriptResponseError({
        error: stderr,
        dependencies: dependenciesPackages,
      }),
    );
  }
  const { masp, digest, exports, dependencies } = await readPackage({
    packageDir: id,
    name,
  });
  await updatePackage({
    id,
    status: "compiled",
    rust: updatedRust,
    masp,
    digest,
    exports,
    dependencies: updatedDependencies,
  });
  return NextResponse.json({
    ok: true,
    error: "",
    masm: "",
    digest,
    masp,
    exports,
    dependencies,
  });
};

export const DELETE = async (
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { id } = await params;
  await Promise.all([deletePackage(id), deletePackageDir(id)]);
  return NextResponse.json({ id });
};
