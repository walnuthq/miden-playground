import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // headers: () => [
  //   {
  //     source: "/:path*",
  //     headers: [
  //       { key: "Access-Control-Allow-Credentials", value: "true" },
  //       {
  //         key: "Access-Control-Allow-Origin",
  //         value: process.env.WEB_URL,
  //       },
  //       {
  //         key: "Access-Control-Allow-Methods",
  //         value: "GET, POST, PATCH, PUT, DELETE, OPTIONS",
  //       },
  //       {
  //         key: "Access-Control-Allow-Headers",
  //         value: "Content-Type, Authorization",
  //       },
  //     ],
  //   },
  // ],
};

export default nextConfig;
