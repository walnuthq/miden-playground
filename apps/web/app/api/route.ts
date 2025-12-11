import { NextResponse } from "next/server";

export const GET = async () =>
  NextResponse.json({
    timestamp: Date.now(),
    env: {
      NODE_ENV: process.env.NODE_ENV,
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    },
  });
