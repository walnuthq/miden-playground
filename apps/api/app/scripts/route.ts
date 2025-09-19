import { type NextRequest, NextResponse } from "next/server";
import { v4 } from "uuid";
import { newPackage, readRust } from "@/lib/miden-compiler";

type CreateScriptRequestBody = { packageName: string; example: string };

export const POST = async (request: NextRequest) => {
  const body = await request.json();
  const { packageName, example } = body as CreateScriptRequestBody;
  const id = `${packageName}-${v4()}`;
  // console.info(`cargo miden new ${id} --name ${packageName}`);
  await newPackage(id, example);
  console.info(`cat /tmp/${id}/src/lib.rs`);
  const rust = await readRust(id);
  return NextResponse.json({ id, rust });
};
