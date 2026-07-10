import { NextResponse } from "next/server";
import {
  WEB_URL,
  API_COMPILE_URL,
  API_REGISTRY_URL,
  PACKAGES_PATH,
} from "@/lib/constants";

export const GET = async () =>
  NextResponse.json({
    timestamp: Date.now(),
    env: {
      NODE_ENV: process.env.NODE_ENV,
      WEB_URL,
      API_COMPILE_URL,
      API_REGISTRY_URL,
      PACKAGES_PATH,
    },
  });
