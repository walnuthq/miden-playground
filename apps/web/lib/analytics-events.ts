// The analytics events the app sends and the Worker's /ingest route accepts,
// shared by both. /ingest is public, so nothing but these names and fields gets
// into Analytics Engine, which never stores an IP, a user agent or an ID.

const eventNames = [
  "page_view",
  "start_tutorial",
  "resume_tutorial",
  "complete_tutorial",
  "complete_tutorial_step",
  "save_project",
  "load_project",
  "delete_project",
  "new_sandbox",
  "launch_example",
  "create_script",
  "import_scripts",
  "compile_script",
  "simulate",
  "deploy_account",
] as const;

export type AnalyticsEventName = (typeof eventNames)[number];

// The keys of `scriptTypes` in lib/types/script.ts, which the Worker can't
// import.
const scriptTypes = [
  "kernel",
  "library",
  "account-component",
  "note",
  "transaction-script",
  "authentication-component",
] as const;

// `ok` is success. `error` is a result the user can act on (a compile with
// diagnostics, a simulation that ran and failed). `failed` is the request or
// the client breaking (network error, API error, crashed mock client).
const outcomes = ["ok", "error", "failed"] as const;

export type AnalyticsOutcome = (typeof outcomes)[number];

// What a simulation ran on: an account component's own throwaway account, the
// simulated account of a note or transaction script, or a sandbox account.
const targets = ["component", "simulated", "sandbox"] as const;

export type AnalyticsMetadata = {
  // The route's pattern (/scripts/:id), never the path: paths hold IDs.
  route?: string;
  tutorial_id?: string;
  network_id?: string;
  wallet_connected?: boolean;
  tutorial_step?: number;
  // The first page view of a visit: see trackPageViews in lib/analytics.ts.
  visit?: boolean;
  // navigator.webdriver: e2e, the status page's probe, QA.
  automated?: boolean;
  // An example's id (lib/examples), or a script template's.
  example_id?: string;
  script_type?: (typeof scriptTypes)[number];
  outcome?: AnalyticsOutcome;
  target?: (typeof targets)[number];
};

export type AnalyticsEvent = { name: AnalyticsEventName } & AnalyticsMetadata;

const isText = (value: unknown) =>
  typeof value === "string" && /^[\w:/*.-]{0,100}$/.test(value);
const isBoolean = (value: unknown) => typeof value === "boolean";
const isNumber = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value);

const isOneOf = (values: readonly string[]) => (value: unknown) =>
  typeof value === "string" && values.includes(value);

const fieldChecks: Record<
  keyof AnalyticsMetadata,
  (value: unknown) => boolean
> = {
  route: isText,
  tutorial_id: isText,
  network_id: isText,
  wallet_connected: isBoolean,
  tutorial_step: isNumber,
  visit: isBoolean,
  automated: isBoolean,
  example_id: isText,
  script_type: isOneOf(scriptTypes),
  outcome: isOneOf(outcomes),
  target: isOneOf(targets),
};

const isAnalyticsEvent = (body: unknown): body is AnalyticsEvent => {
  if (typeof body !== "object" || body === null) {
    return false;
  }
  const { name, ...fields } = body as Record<string, unknown>;
  return (
    eventNames.includes(name as AnalyticsEventName) &&
    Object.entries(fields).every(
      ([field, value]) =>
        Object.hasOwn(fieldChecks, field) &&
        fieldChecks[field as keyof AnalyticsMetadata](value),
    )
  );
};

// Analytics Engine's columns are positional: never reorder these, or data
// already written changes meaning. `index1` and `blob1` are the event's name,
// `blob2…6` route, tutorial_id, network_id, wallet_connected and automated,
// `blob7…10` example_id, script_type, outcome and target, `double1…2`
// tutorial_step and visit. A new field takes the next free column.
// scripts/analytics-report.ts reads them.
export const toDataPoint = (body: unknown) => {
  if (!isAnalyticsEvent(body)) {
    return null;
  }
  return {
    indexes: [body.name],
    blobs: [
      body.name,
      body.route ?? "",
      body.tutorial_id ?? "",
      body.network_id ?? "",
      String(body.wallet_connected ?? ""),
      String(body.automated ?? ""),
      body.example_id ?? "",
      body.script_type ?? "",
      body.outcome ?? "",
      body.target ?? "",
    ],
    doubles: [body.tutorial_step ?? 0, body.visit ? 1 : 0],
  };
};
