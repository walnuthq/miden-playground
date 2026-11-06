import type { createBrowserRouter } from "react-router";
import type {
  AnalyticsEvent,
  AnalyticsEventName,
  AnalyticsMetadata,
} from "@/lib/analytics-events";

// Analytics Engine, through the Worker's /ingest route, next to Simple Analytics
// for the trial in spec/analytics-trial.md. Only the built app has a Worker.
const ingest = (event: AnalyticsEvent) => {
  if (import.meta.env.PROD) {
    navigator.sendBeacon(
      "/ingest",
      JSON.stringify({ ...event, automated: navigator.webdriver }),
    );
  }
};

// Custom events, to both. sa_event is undefined when Simple Analytics' script
// (/proxy.js, served by the Worker) isn't loaded, e.g. under `vite`.
export const trackEvent = (
  name: Exclude<AnalyticsEventName, "page_view">,
  metadata?: AnalyticsMetadata,
) => {
  window.sa_event?.(name, metadata);
  ingest({ name, ...metadata });
};

// Simple Analytics' rule for a unique page view (docs.simpleanalytics.com/
// explained/unique-visits): direct traffic or another site's referrer, and no
// reload or back/forward. Later page views of a document are internal.
const startsVisit = () => {
  const [navigation] = performance.getEntriesByType(
    "navigation",
  ) as PerformanceNavigationTiming[];
  if (navigation?.type !== "navigate") {
    return false;
  }
  return (
    !document.referrer ||
    new URL(document.referrer).hostname !== window.location.hostname
  );
};

type Router = ReturnType<typeof createBrowserRouter>;

const routePattern = ({ matches }: Router["state"]) =>
  `/${matches
    .map(({ route }) => route.path)
    .filter(Boolean)
    .join("/")}`;

// Page views for Analytics Engine (Simple Analytics' script and Cloudflare's
// beacon count their own). From the router rather than a component, so a visitor
// who leaves before the WASM loads still counts.
export const trackPageViews = (router: Router) => {
  ingest({
    name: "page_view",
    route: routePattern(router.state),
    visit: startsVisit(),
  });
  let { pathname } = router.state.location;
  router.subscribe((state) => {
    if (state.location.pathname !== pathname) {
      ({ pathname } = state.location);
      ingest({ name: "page_view", route: routePattern(state), visit: false });
    }
  });
  // Back to this document from the back/forward cache: no new load.
  window.addEventListener("pageshow", ({ persisted }) => {
    if (persisted) {
      ingest({
        name: "page_view",
        route: routePattern(router.state),
        visit: false,
      });
    }
  });
};
