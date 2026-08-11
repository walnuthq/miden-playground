import "dotenv/config";
import fs from "node:fs";
import path from "node:path";

import { chromium, type Browser, type Page } from "playwright";

import type {
  EndpointStatus,
  ServiceHealth,
  ServiceStatus,
  StatusSnapshot,
} from "../src/lib/types.js";

// Build-time probe. Runs on the CI runner (see
// .github/workflows/deploy-status-page.yml) rather than in the browser: the web
// app sends no CORS headers, and client-side checks would also be measuring the
// viewer's network rather than the services.
//
// The output is written to public/, so Vite copies it into dist/ verbatim and
// the page fetches it at runtime. Keeping it out of the module graph means a
// fresh checkout can `pnpm typecheck` and `pnpm build` without the file
// existing yet.

// `||`, not `??`: GitHub Actions sets an undefined repository variable to an
// empty string, and an empty URL would fail every check with "Invalid URL"
// rather than falling back to the documented default.
const WEB_URL = process.env.WEB_URL || "http://localhost:3000";
const API_URL = process.env.API_URL || "http://localhost:3001";

/**
 * Where the last published snapshot lives. That file is this probe's only
 * memory: it is what tells scripts/notify.ts whether an outage is new. Derived
 * from the repository so a fork reads its own state rather than walnuthq's;
 * unset locally, which is why local runs never notify.
 */
const statusPageUrl = () => {
  if (process.env.STATUS_PAGE_URL) return process.env.STATUS_PAGE_URL;
  const repository = process.env.GITHUB_REPOSITORY;
  if (!repository) return null;
  const [owner, name] = repository.split("/");
  if (!owner || !name) return null;
  // github.io hosts are lowercase; repository owners are not necessarily.
  return `https://${owner.toLowerCase()}.github.io/${name}/`;
};

const PREVIOUS_SNAPSHOT_TIMEOUT_MS = 10_000;

const API_TIMEOUT_MS = 15_000;
// Generous, because the first document response is Vercel's challenge page and
// the real one only arrives after the browser has solved it (~1s in practice).
const WEB_NAVIGATION_TIMEOUT_MS = 30_000;
// The playground hydrates and hands off from the Miden client provider in ~5s
// against production; this leaves room for a cold cache and a slow runner.
const WEB_RENDER_TIMEOUT_MS = 60_000;

const EXPECTED_TITLE = "Miden Playground";

// Chrome's default 800x600 viewport puts the playground in its mobile layout,
// where `useIsMobile` swaps the sidebar for a closed Sheet — the nav links the
// render check waits on are then absent from the DOM entirely.
const VIEWPORT = { width: 1280, height: 900 };

// Both markers render only after hydration: they sit behind `useIsClient()` in
// apps/web/components/lib/app-sidebar.tsx and apps/web/components/home/index.tsx
// is mounted below MidenProvider, which shows a loading state until the WASM
// client is ready. Waiting on them proves the bundle executed, React hydrated
// and the app painted — none of which a plain HTTP request can tell us.
const SIDEBAR_NAV_SELECTOR = 'a[href="/accounts"]';
const HOME_HEADING_SELECTOR = 'h3:has-text("Tutorials")';

// Vercel's Attack Mode answers every request with HTTP 429 and a JS challenge.
// A browser on a residential IP clears it in about a second; the same browser on
// a CI runner's datacenter IP never does, which is documented behaviour —
// "non-recognized automated services may not be able to pass challenges".
//
// That is why a challenge is reported as `blocked` rather than `unhealthy`: it
// is evidence about the doorman, not about the service. Treating it as an
// outage produced a false positive on the published page, and would page
// whoever is on call for a firewall setting.
const VERCEL_CHALLENGE_TITLE = "Vercel Security Checkpoint";
// Set by Vercel on any mitigated response; more reliable than sniffing titles.
const VERCEL_MITIGATION_HEADER = "x-vercel-mitigated";

// Aborts are routine (React cleanup, the Miden client tearing down streams) and
// the analytics proxy is a third party behind a same-origin path, so neither
// says anything about the playground's health.
const IGNORED_REQUEST_FAILURE = "net::ERR_ABORTED";
const IGNORED_REQUEST_PATHS = ["/proxy.js", "/proxy.dev.js", "/simple/"];

type CheckDefinition = {
  id: string;
  label: string;
  description: string;
};

const webChecks = {
  load: {
    id: "page-loads",
    label: "page loads",
    description: `Serves a document titled “${EXPECTED_TITLE}”, clearing Vercel's challenge.`,
  },
  render: {
    id: "playground-renders",
    label: "playground renders",
    description:
      "JavaScript ran and the SPA painted: hydrated sidebar navigation and the home page headings.",
  },
  errors: {
    id: "no-client-errors",
    label: "no client errors",
    description: "No uncaught exceptions and no failed requests while loading.",
  },
} satisfies Record<string, CheckDefinition>;

const failed = (
  check: CheckDefinition,
  error: string,
  responseTimeMs: number,
): EndpointStatus => ({
  ...check,
  health: "unhealthy",
  httpStatus: null,
  responseTimeMs,
  summary: null,
  payload: null,
  error,
});

/** Refused before it could measure: unknown, not failed. See CheckHealth. */
const blocked = (
  check: CheckDefinition,
  error: string,
  responseTimeMs: number,
  httpStatus: number | null = null,
): EndpointStatus => ({
  ...check,
  health: "blocked",
  httpStatus,
  responseTimeMs,
  summary: null,
  payload: null,
  error,
});

// Playwright appends a multi-line, ANSI-coloured call log to its errors. The
// first line is the diagnosis; the rest would swamp the card.
const describeError = (error: unknown) => {
  const message = error instanceof Error ? error.message : "Request failed";
  return message.split("\n")[0]?.trim() ?? message;
};

/**
 * Polls from Node rather than in the page, so it survives the reload Vercel's
 * challenge performs once it has been solved.
 */
const waitForTitle = async (page: Page, timeoutMs: number) => {
  const deadline = Date.now() + timeoutMs;
  let title = "";
  while (Date.now() < deadline) {
    title = await page.title().catch(() => "");
    if (title === EXPECTED_TITLE) return { ok: true as const, title };
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  return { ok: false as const, title };
};

/** `GET /` on the API. Small JSON payload, so the card renders it in full. */
const probeApiRoot = async (): Promise<EndpointStatus> => {
  const check = {
    id: "root",
    label: "GET /",
    description: "Returns the service's timestamp and resolved configuration.",
  };
  const startedAt = performance.now();
  const elapsed = () => Math.round(performance.now() - startedAt);

  try {
    const response = await fetch(new URL("/", API_URL), {
      signal: AbortSignal.timeout(API_TIMEOUT_MS),
      headers: { accept: "application/json" },
    });

    if (!response.ok) {
      return {
        ...check,
        health: "unhealthy",
        httpStatus: response.status,
        responseTimeMs: elapsed(),
        summary: null,
        payload: null,
        error: `HTTP ${response.status} ${response.statusText}`.trim(),
      };
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      // A 200 that isn't JSON means the endpoint's contract is broken, so it
      // counts as unhealthy rather than merely undisplayable.
      return {
        ...check,
        health: "unhealthy",
        httpStatus: response.status,
        responseTimeMs: elapsed(),
        summary: null,
        payload: null,
        error: "Response body was not valid JSON",
      };
    }

    return {
      ...check,
      health: "healthy",
      httpStatus: response.status,
      responseTimeMs: elapsed(),
      summary: null,
      payload,
      error: null,
    };
  } catch (error) {
    return failed(check, describeError(error), elapsed());
  }
};

/**
 * All three web checks share a single browser session: the page is loaded once
 * and each check reads a different milestone off that load.
 */
const probeWeb = async (): Promise<EndpointStatus[]> => {
  const startedAt = performance.now();
  const elapsed = () => Math.round(performance.now() - startedAt);

  let browser: Browser;
  try {
    browser = await chromium.launch();
  } catch (error) {
    const message = describeError(error).includes("Executable doesn't exist")
      ? "chromium is not installed — run `pnpm --filter status-page exec playwright install chromium`"
      : describeError(error);
    return Object.values(webChecks).map((check) =>
      failed(check, message, elapsed()),
    );
  }

  const pageErrors: string[] = [];
  const requestFailures: string[] = [];
  let documentStatus: number | null = null;
  let documentMitigation: string | null = null;

  try {
    const page = await browser.newPage({ viewport: VIEWPORT });

    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("requestfailed", (request) => {
      const failure = request.failure()?.errorText ?? "request failed";
      const url = request.url();
      if (failure === IGNORED_REQUEST_FAILURE) return;
      if (!url.startsWith(new URL("/", WEB_URL).toString())) return;
      if (IGNORED_REQUEST_PATHS.some((ignored) => url.includes(ignored)))
        return;
      requestFailures.push(`${url} — ${failure}`);
    });
    page.on("response", (response) => {
      // The challenge answers first and the real document second, so the last
      // main-frame navigation response is the one worth reporting.
      const request = response.request();
      if (
        request.isNavigationRequest() &&
        request.frame() === page.mainFrame()
      ) {
        documentStatus = response.status();
        documentMitigation =
          response.headers()[VERCEL_MITIGATION_HEADER] ?? null;
      }
    });

    let loadError: string | null = null;
    let title = "";
    try {
      await page.goto(WEB_URL, {
        waitUntil: "domcontentloaded",
        timeout: WEB_NAVIGATION_TIMEOUT_MS,
      });
      const result = await waitForTitle(page, WEB_NAVIGATION_TIMEOUT_MS);
      title = result.title;
      if (!result.ok) {
        loadError = title.includes(VERCEL_CHALLENGE_TITLE)
          ? `stuck on Vercel's security checkpoint (HTTP ${documentStatus ?? "429"}) — the browser did not clear the challenge`
          : `expected the document title to be “${EXPECTED_TITLE}”, got “${title || "(empty)"}”`;
      }
    } catch (error) {
      loadError = describeError(error);
    }

    // A firewall turned the probe away, so nothing downstream measured the app:
    // the SPA never got a chance to render, and "no client errors" would only be
    // reporting that the challenge page itself did not throw. Every check on
    // this service is unknown, not failed.
    const challenged =
      documentMitigation === "challenge" ||
      title.includes(VERCEL_CHALLENGE_TITLE);
    if (loadError !== null && challenged) {
      const at = elapsed();
      const detail = `blocked by a Vercel challenge (HTTP ${documentStatus ?? 429}) — the probe never reached the app, so its health is unknown`;
      return [
        blocked(webChecks.load, detail, at, documentStatus),
        blocked(webChecks.render, "not measured — the probe was blocked", at),
        blocked(webChecks.errors, "not measured — the probe was blocked", at),
      ];
    }

    const loadedAt = elapsed();
    const load: EndpointStatus = {
      ...webChecks.load,
      health: loadError === null ? "healthy" : "unhealthy",
      httpStatus: documentStatus,
      responseTimeMs: loadedAt,
      summary: { title: title || "—" },
      payload: null,
      error: loadError,
    };

    let render: EndpointStatus;
    if (loadError !== null) {
      // Nothing loaded, so there is nothing to have rendered. Reporting the
      // cause beats a second copy of the same timeout.
      render = failed(webChecks.render, "the page never loaded", elapsed());
    } else {
      try {
        await page.waitForSelector(SIDEBAR_NAV_SELECTOR, {
          timeout: WEB_RENDER_TIMEOUT_MS,
        });
        const sidebarAt = elapsed();
        await page.waitForSelector(HOME_HEADING_SELECTOR, {
          timeout: WEB_RENDER_TIMEOUT_MS,
        });
        render = {
          ...webChecks.render,
          health: "healthy",
          httpStatus: null,
          responseTimeMs: elapsed(),
          summary: {
            "sidebar navigation": `${sidebarAt}ms`,
            "home page headings": `${elapsed()}ms`,
          },
          payload: null,
          error: null,
        };
      } catch (error) {
        render = failed(
          webChecks.render,
          `${describeError(error)} — the page loaded but the SPA did not render`,
          elapsed(),
        );
      }
    }

    const problems = [
      ...pageErrors.map((message) => `uncaught: ${message}`),
      ...requestFailures.map((message) => `request failed: ${message}`),
    ];
    const errors: EndpointStatus = {
      ...webChecks.errors,
      health: problems.length === 0 ? "healthy" : "unhealthy",
      httpStatus: null,
      responseTimeMs: elapsed(),
      summary: {
        "uncaught exceptions": pageErrors.length,
        "failed requests": requestFailures.length,
      },
      payload: null,
      error: problems.length === 0 ? null : problems.join("; "),
    };

    return [load, render, errors];
  } catch (error) {
    return Object.values(webChecks).map((check) =>
      failed(check, describeError(error), elapsed()),
    );
  } finally {
    await browser.close();
  }
};

/**
 * Best effort by design: a 404 on the very first deploy, a network blip or a
 * malformed body all mean "no previous state", never a failed build. The worst
 * consequence is a repeated notification, never a missed one.
 */
const fetchPreviousSnapshot = async (): Promise<StatusSnapshot | null> => {
  const base = statusPageUrl();
  if (!base) {
    console.log(
      "no STATUS_PAGE_URL and no GITHUB_REPOSITORY — starting without previous state",
    );
    return null;
  }
  // Pages serves status.json with `cache-control: max-age=600`. That is well
  // inside the 30-minute cron, but the query param removes all doubt.
  const url = new URL("status.json", base);
  url.searchParams.set("t", Date.now().toString());
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(PREVIOUS_SNAPSHOT_TIMEOUT_MS),
      headers: { accept: "application/json", "cache-control": "no-cache" },
    });
    if (!response.ok) {
      console.log(
        `no previous snapshot: HTTP ${response.status} from ${url.origin}${url.pathname}`,
      );
      return null;
    }
    const snapshot = (await response.json()) as StatusSnapshot;
    if (!Array.isArray(snapshot.services)) {
      console.log("previous snapshot has no services array — ignoring it");
      return null;
    }
    console.log(`previous snapshot: ${snapshot.checkedAt}`);
    return snapshot;
  } catch (error) {
    console.log(`no previous snapshot: ${describeError(error)}`);
    return null;
  }
};

const rollUp = (endpoints: EndpointStatus[]): ServiceHealth => {
  // Blocked outranks everything: a service whose probe was refused has no
  // measured health at all, and mixing that into healthy/degraded would be a
  // claim the probe cannot support.
  if (endpoints.some((endpoint) => endpoint.health === "blocked")) {
    return "blocked";
  }
  const healthy = endpoints.filter(
    (endpoint) => endpoint.health === "healthy",
  ).length;
  if (healthy === endpoints.length) return "healthy";
  return healthy === 0 ? "unhealthy" : "degraded";
};

// Every check is individually caught above and this script always exits 0. A
// service being down must still produce a status page — that is precisely when
// someone is looking at it.
const [previous, [apiEndpoints, webEndpoints]] = await Promise.all([
  fetchPreviousSnapshot(),
  Promise.all([Promise.all([probeApiRoot()]), probeWeb()]),
]);

const checkedAt = new Date().toISOString();

/**
 * Carries the outage clock forward: `since` only moves when the health changes,
 * so it marks the start of the current state rather than the time of this run.
 */
const withHistory = (
  service: Omit<ServiceStatus, "previousHealth" | "since">,
): ServiceStatus => {
  const before = previous?.services.find(({ id }) => id === service.id);
  // `before` is parsed from a published file that may predate these fields —
  // the first run after this ships reads a snapshot with no `since` at all — so
  // it is treated as untrusted rather than as a ServiceStatus.
  const unchanged = before !== undefined && before.health === service.health;
  return {
    ...service,
    previousHealth: before?.health ?? null,
    since: unchanged && before.since ? before.since : checkedAt,
  };
};

const services: ServiceStatus[] = [
  withHistory({
    id: "web",
    name: "web",
    description:
      "The playground itself — a browser IDE for writing, running and deploying Miden smart contracts.",
    url: WEB_URL,
    health: rollUp(webEndpoints),
    endpoints: webEndpoints,
  }),
  withHistory({
    id: "api",
    name: "api",
    description:
      "Backend for compiling Miden packages, storing scripts and serving verified components.",
    url: API_URL,
    health: rollUp(apiEndpoints),
    endpoints: apiEndpoints,
  }),
];

const snapshot: StatusSnapshot = {
  checkedAt,
  previousCheckedAt: previous?.checkedAt ?? null,
  services,
};

const outDir = path.resolve(import.meta.dirname, "..", "public");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(
  path.join(outDir, "status.json"),
  JSON.stringify(snapshot, null, 2),
);

for (const service of snapshot.services) {
  const healthy = service.endpoints.filter(
    (endpoint) => endpoint.health === "healthy",
  ).length;
  console.log(
    `${service.name}: ${service.health} (${healthy}/${service.endpoints.length})`,
  );
  for (const endpoint of service.endpoints) {
    const outcomes = {
      healthy: "ok",
      unhealthy: `FAILED — ${endpoint.error}`,
      blocked: `BLOCKED — ${endpoint.error}`,
    };
    const state = outcomes[endpoint.health];
    console.log(
      `  ${endpoint.label} — ${state} in ${endpoint.responseTimeMs}ms`,
    );
  }
}
