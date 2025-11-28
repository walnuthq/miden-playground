import { type NextRequest, NextResponse } from "next/server";
import { v4 } from "uuid";
import { newPackage, readRust } from "@/lib/miden-compiler";

type CreateScriptRequestBody = {
  packageName: string;
  type: string;
  example: string;
};

export const POST = async (request: NextRequest) => {
  const body = await request.json();
  const { packageName, type, example } = body as CreateScriptRequestBody;
  const id = v4();
  await newPackage({
    packageDir: id,
    packageName,
    type,
    example:
      type === "account" ? "counter-contract" : "counter-contract-tx-script",
  });
  const rust = await readRust(id);
  return NextResponse.json({ id, rust });
};
