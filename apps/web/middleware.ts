import { NextResponse } from "next/server";

export const middleware = () => {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.rewrite(
      "https://miden-playground-assets.walnut.dev/_next/static/media/miden_client_web.e00a052b.wasm",
    );
  }
  return NextResponse.next();
};

export const config = {
  matcher: "/_next/static/media/miden_client_web.e6753bbd.wasm",
};
