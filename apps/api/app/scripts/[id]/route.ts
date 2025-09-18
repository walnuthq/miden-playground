import { type NextRequest, NextResponse } from "next/server";
import {
  updateRust,
  compilePackage,
  compileWasmToMasm,
  readMasm,
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
  console.info(`cp source /tmp/${id}/src/lib.rs`);
  await updateRust(id, rust);
  console.info("cargo miden build --release");
  const { stderr } = await compilePackage(id);
  if (stderr) {
    return NextResponse.json({ ok: false, error: stderr, masm: "" });
  }
  console.info(
    `midenc compile --emit masm=${id}.masm target/wasm32-wasip2/release/${id}.wasm`
  );
  await compileWasmToMasm(id);
  console.info(`cat /tmp/${id}/miden:${id}/${id}@0.1.masm`);
  const masm = await readMasm(id);
  return NextResponse.json({ ok: true, error: "", masm });
};

export const DELETE = async (
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  console.info(`rm -rf ${id}`);
  await deletePackage(id);
  return NextResponse.json({ id });
};
