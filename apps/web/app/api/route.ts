import { NextResponse } from "next/server";

export const GET = async () =>
  NextResponse.json({
    timestamp: Date.now(),
    env: {
      ENVIRONMENT: process.env.ENVIRONMENT,
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    },
  });
