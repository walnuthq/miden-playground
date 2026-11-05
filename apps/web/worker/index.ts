// Serves the SPA from static assets (wrangler.jsonc `assets`), the client WASM
// precompressed, and proxies Simple Analytics through our domain, as
// @simpleanalytics/next's rewrites did. Only the paths in
// `assets.run_worker_first` reach this Worker.

// Visitor IPs never reach Simple Analytics (as in SA's own proxy configs), and
// neither do our cookies.
const droppedHeaders = [
  "cookie",
  "cf-connecting-ip",
  "cf-connecting-ipv6",
  "x-forwarded-for",
  "x-real-ip",
  "true-client-ip",
];

const proxy = (request: Request, target: string) => {
  const headers = new Headers(request.headers);
  for (const header of droppedHeaders) {
    headers.delete(header);
  }
  return fetch(target, {
    method: request.method,
    headers,
    body: request.body,
    redirect: "manual",
  });
};

const simpleAnalyticsTarget = (url: URL, hostname: string) => {
  if (url.pathname === "/proxy.js") {
    return `https://simpleanalyticsexternal.com/proxy.js?hostname=${hostname}&path=/simple`;
  }
  if (url.pathname === "/auto-events.js") {
    return "https://scripts.simpleanalyticscdn.com/auto-events.js";
  }
  if (url.pathname.startsWith("/simple/")) {
    return `https://queue.simpleanalyticscdn.com${url.pathname.slice("/simple".length)}${url.search}`;
  }
};

// Serves the client WASM's brotli level 11 file, which the build writes next to
// it (precompressWasm in vite.config.ts), instead of Cloudflare's on-the-fly
// compression: 4.0 MB instead of 5.8 MB. The SDK compiles it with
// instantiateStreaming, which needs the WASM content type.
const serveWasm = async (request: Request, env: Env, url: URL) => {
  // Behind Cloudflare, the header may no longer be what the client sent.
  const acceptEncoding =
    (request.cf?.clientAcceptEncoding as string | undefined) ??
    request.headers.get("accept-encoding") ??
    "";
  if (/\bbr\b/.test(acceptEncoding)) {
    const headers = new Headers(request.headers);
    // The file's bytes as they are, whole.
    headers.set("accept-encoding", "identity");
    headers.delete("range");
    const precompressed = await env.ASSETS.fetch(
      new Request(new URL(`${url.pathname}.br`, url), {
        method: request.method,
        headers,
      }),
    );
    // A missing file gets index.html and a 200 (`not_found_handling`).
    const found =
      precompressed.status === 304 ||
      (precompressed.ok &&
        !precompressed.headers.get("content-type")?.startsWith("text/html"));
    if (found) {
      const responseHeaders = new Headers(precompressed.headers);
      responseHeaders.set("content-type", "application/wasm");
      responseHeaders.set("content-encoding", "br");
      responseHeaders.append("vary", "Accept-Encoding");
      return new Response(precompressed.body, {
        status: precompressed.status,
        headers: responseHeaders,
        // Already compressed: the runtime must send the bytes as they are.
        encodeBody: "manual",
      });
    }
  }
  const asset = await env.ASSETS.fetch(request);
  const response = new Response(asset.body, asset);
  response.headers.append("vary", "Accept-Encoding");
  return response;
};

export default {
  fetch: async (request, env) => {
    const url = new URL(request.url);
    if (
      (request.method === "GET" || request.method === "HEAD") &&
      /^\/assets\/[^/]+\.wasm$/.test(url.pathname)
    ) {
      return serveWasm(request, env, url);
    }
    const target = simpleAnalyticsTarget(url, env.SIMPLE_ANALYTICS_HOSTNAME);
    if (target) {
      // Analytics is disabled when the hostname is unset (local `wrangler dev`).
      return env.SIMPLE_ANALYTICS_HOSTNAME
        ? proxy(request, target)
        : new Response("Not found", { status: 404 });
    }
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
