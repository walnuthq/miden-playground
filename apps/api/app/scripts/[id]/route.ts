import { type NextRequest, NextResponse } from "next/server";
import {
  updateRust,
  compilePackage,
  compileWasmToMasm,
  deletePackage,
  packageExists,
} from "@/lib/miden-compiler";

type CompileScriptRequestBody = { rust: string };

export const PATCH = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const exists = await packageExists(id);
  if (!exists) {
    return NextResponse.json({ ok: false, error: "ENOENT", masm: "" });
  }
  const body = await request.json();
  const { rust } = body as CompileScriptRequestBody;
  await updateRust(id, rust);
  const { stderr } = await compilePackage(id);
  if (stderr) {
    return NextResponse.json({ ok: false, error: stderr, masm: "" });
  }
  const masm = await compileWasmToMasm(id);
  return NextResponse.json({ ok: true, error: "", masm });
};

export const DELETE = async (
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  await deletePackage(id);
  return NextResponse.json({ id });
};
