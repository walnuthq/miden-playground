import { NextResponse } from "next/server";

export const GET = async () => NextResponse.json({ timestamp: Date.now() });
