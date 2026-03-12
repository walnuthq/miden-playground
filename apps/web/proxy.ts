import { NextResponse } from "next/server";

export const proxy = () => {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.rewrite(
      "https://miden-playground-assets.walnut.dev/_next/static/media/miden_client_web.e00a052b.wasm",
    );
  }
  return NextResponse.next();
};

export const config = {
  matcher: "/_next/static/media/miden_client_web.8318b253.wasm",
};
