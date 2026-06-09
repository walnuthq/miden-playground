import { NextResponse } from "next/server";

export const GET = async () =>
  NextResponse.json({
    timestamp: Date.now(),
    env: {
      NODE_ENV: process.env.NODE_ENV,
      WEB_URL: process.env.WEB_URL,
      API_COMPILE_URL: process.env.API_COMPILE_URL,
      API_REGISTRY_URL: process.env.API_REGISTRY_URL,
      PACKAGES_PATH: process.env.PACKAGES_PATH,
    },
  });
