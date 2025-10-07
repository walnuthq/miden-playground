import { cargoMidenVersion, midenCompilerVersion } from "@/lib/miden-compiler";
import { NextResponse } from "next/server";

export const GET = async () => {
  const [cargoMidenVersionResult, midenCompilerVersionResult] =
    await Promise.all([cargoMidenVersion(), midenCompilerVersion()]);
  return NextResponse.json({
    timestamp: Date.now(),
    env: {
      WEB_URL: process.env.WEB_URL,
      PACKAGES_PATH: process.env.PACKAGES_PATH,
    },
    cargoMidenVersion: cargoMidenVersionResult,
    midenCompilerVersion: midenCompilerVersionResult,
  });
};
