import { type NextRequest, NextResponse } from "next/server";
import {
  updateRust,
  compilePackage,
  deletePackage,
  packageExists,
  readPackage,
  generateCargoToml,
  generatePackageDir,
} from "@/lib/miden-compiler";
import { type Export, type Dependency } from "@/lib/types";

type CompileScriptRequestBody = {
  name: string;
  type: string;
  rust: string;
  dependencies: Dependency[];
};

type CompileScriptResponse = {
  ok: boolean;
  error: string;
  masm: string;
  root: string;
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
  root: "",
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
  const {
    name,
    type,
    rust: updatedRust,
    dependencies: updatedDependencies,
  } = body as CompileScriptRequestBody;
  const exists = await packageExists(packageDir);
  if (!exists) {
    await generatePackageDir({
      packageDir,
      name,
      type,
      rust: updatedRust,
      dependencies: updatedDependencies,
    });
    // console.error("ENOENT", packageDir);
    // return NextResponse.json(
    //   compileScriptResponseError({
    //     error: "ENOENT",
    //     dependencies: updatedDependencies,
    //   })
    // );
  }
  await Promise.all([
    updateRust({ packageDir, rust: updatedRust }),
    generateCargoToml({
      packageDir,
      name,
      type,
      dependencies: updatedDependencies,
    }),
  ]);
  const { stderr } = await compilePackage(packageDir);
  if (stderr) {
    console.error(stderr);
    return NextResponse.json(
      compileScriptResponseError({
        error: stderr,
        dependencies: updatedDependencies,
      })
    );
  }
  // const masm = await compileWasmToMasm(id);
  const { packageBuffer, exports, dependencies } = await readPackage({
    packageDir,
    name,
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
  await deletePackage(id);
  return NextResponse.json({ id });
};
