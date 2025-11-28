import { type NextRequest, NextResponse } from "next/server";
import {
  updateRust,
  compilePackage,
  deletePackage,
  packageExists,
  readPackage,
} from "@/lib/miden-compiler";

type CompileScriptRequestBody = { rust: string };

export const PATCH = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const exists = await packageExists(id);
  if (!exists) {
    console.error("ENOENT", id);
    return NextResponse.json({
      ok: false,
      error: "ENOENT",
      masm: "",
      root: "",
      package: { type: "Buffer", data: [] },
      procedures: [],
    });
  }
  const body = await request.json();
  const { rust } = body as CompileScriptRequestBody;
  await updateRust(id, rust);
  const { stderr } = await compilePackage(id);
  if (stderr) {
    console.error(stderr);
    return NextResponse.json({
      ok: false,
      error: stderr,
      masm: "",
      root: "",
      package: { type: "Buffer", data: [] },
      procedures: [],
    });
  }
  // const masm = await compileWasmToMasm(id);
  const { packageBuffer, exports, dependencies } = await readPackage(id);
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
