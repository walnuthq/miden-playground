// Serves the SPA from static assets (wrangler.jsonc `assets`) and proxies Simple
// Analytics through our domain, as @simpleanalytics/next's rewrites did. Only
// the paths in `assets.run_worker_first` reach this Worker.

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

export default {
  fetch: async (request, env) => {
    const url = new URL(request.url);
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
