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
} from "@/db/package";

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
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id: packageDir } = await params;
  const body = await request.json();
  const { rust: updatedRust, dependencies: updatedDependencies } =
    body as CompileScriptRequestBody;
  const [exists, { name, type }, dependenciesPackages] = await Promise.all([
    packageExists(packageDir),
    getPackage(packageDir),
    getDependencies(updatedDependencies),
  ]);
  if (exists) {
    await updateRust({ packageDir, rust: updatedRust });
  } else {
    await generatePackageDir({
      packageDir,
      name,
      type,
      rust: updatedRust,
      dependencies: updatedDependencies,
    });
  }
  await generateCargoToml({
    packageDir,
    name,
    type,
    dependencies: dependenciesPackages,
  });
  const { stderr } = await compilePackage(packageDir);
  if (stderr) {
    console.error(stderr);
    await updatePackage({
      id: packageDir,
      status: "error",
      rust: updatedRust,
      dependencies: updatedDependencies,
      exports: [],
    });
    return NextResponse.json(
      compileScriptResponseError({
        error: stderr,
        dependencies: dependenciesPackages,
      })
    );
  }
  const { packageBuffer, exports, dependencies } = await readPackage({
    packageDir,
    name,
  });
  await updatePackage({
    id: packageDir,
    status: "compiled",
    rust: updatedRust,
    dependencies: updatedDependencies,
    exports,
  });
  return NextResponse.json({
    ok: true,
    error: "",
    masm: "",
    root: "",
    package: packageBuffer,
    exports,
    dependencies,
  });
};

export const DELETE = async (
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  await Promise.all([deletePackage(id), deletePackageDir(id)]);
  return NextResponse.json({ id });
};
