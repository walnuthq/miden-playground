import { cargoMidenVersion } from "@/lib/miden-compiler";
import { NextResponse } from "next/server";

export const GET = async () =>
  NextResponse.json({
    timestamp: Date.now(),
    env: {
      NODE_ENV: process.env.NODE_ENV,
      WEB_URL: process.env.WEB_URL,
      PACKAGES_PATH: process.env.PACKAGES_PATH,
    },
    cargoMidenVersion: await cargoMidenVersion(),
  });
