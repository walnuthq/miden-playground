import { type NextRequest, NextResponse } from "next/server";
import {
  newPackage,
  updateSource,
  compilePackage,
  compileWasmToMasm,
  packageExists,
  readMasm,
} from "@/lib/miden-compiler";

type CompileScriptRequestBody = { rust: string };

export const POST = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id: packageName } = await params;
  const body = await request.json();
  const { rust } = body as CompileScriptRequestBody;
  const exists = await packageExists(packageName);
  if (!exists) {
    console.log(`cargo miden new ${packageName}`);
    await newPackage(packageName);
  }
  console.log(`cp source /tmp/${packageName}/src/lib.rs`);
  await updateSource(packageName, rust);
  console.log("cargo miden build --release");
  const { stdout, stderr } = await compilePackage(packageName);
  if (stderr) {
    return NextResponse.json({ ok: false, error: stderr, masm: "" });
  }
  console.log(
    `midenc compile --emit masm=${packageName}.masm,masp target/wasm32-wasip2/release/${packageName}.wasm`
  );
  await compileWasmToMasm(packageName);
  console.log(
    `cat /tmp/${packageName}/miden:${packageName}/${packageName}@0.1.masm`
  );
  const masm = await readMasm(packageName);
  return NextResponse.json({ ok: true, error: "", masm });
};
