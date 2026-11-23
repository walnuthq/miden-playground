// Daily counts from Analytics Engine, for the trial in spec/analytics-trial.md.
//
//   pnpm analytics:report [days, default 30]
//
// Needs ANALYTICS_ACCOUNT_ID and ANALYTICS_API_TOKEN (Account Analytics Read) in
// the environment or .env.local. `people` leaves out automated traffic (e2e, the
// status page's probe, QA). Compare it with Simple Analytics' and Web Analytics'
// dashboards over the same dates, in UTC.
//
// A second table breaks the product events (spec/product-analytics-events.md)
// down by their fields, over the whole period. Rows written before those
// fields existed have no blob7…10, which Analytics Engine returns as ''.
import { existsSync } from "node:fs";

if (existsSync(".env.local")) {
  process.loadEnvFile(".env.local");
}

const { ANALYTICS_ACCOUNT_ID, ANALYTICS_API_TOKEN } = process.env;
if (!ANALYTICS_ACCOUNT_ID || !ANALYTICS_API_TOKEN) {
  throw new Error("ANALYTICS_ACCOUNT_ID and ANALYTICS_API_TOKEN are required");
}

const days = Number(process.argv[2] ?? 30);
if (!Number.isInteger(days) || days < 1 || days > 92) {
  throw new Error("days must be a whole number from 1 to 92");
}

// Columns: lib/analytics-events.ts. Analytics Engine may sample, so each row
// counts for _sample_interval rows.
const query = `
  SELECT
    toStartOfInterval(timestamp, INTERVAL '1' DAY) AS day,
    blob1 AS event,
    blob6 AS automated,
    SUM(_sample_interval) AS total,
    SUM(_sample_interval * double2) AS visits
  FROM miden_playground_events
  WHERE timestamp > NOW() - INTERVAL '${days}' DAY
  GROUP BY day, event, automated
  ORDER BY day, event
  FORMAT JSON
`;

const runQuery = async <Row>(sql: string) => {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${ANALYTICS_ACCOUNT_ID}/analytics_engine/sql`,
    {
      method: "POST",
      headers: { authorization: `Bearer ${ANALYTICS_API_TOKEN}` },
      body: sql,
    },
  );
  if (!response.ok) {
    throw new Error(
      `Analytics Engine: ${response.status} ${await response.text()}`,
    );
  }
  const { data } = (await response.json()) as { data: Row[] };
  return data;
};

type Row = {
  day: string;
  event: string;
  automated: string;
  total: string | number;
  visits: string | number;
};
const data = await runQuery<Row>(query);

type Line = {
  day: string;
  event: string;
  all: number;
  people: number;
  visits_all: number;
  visits_people: number;
};
const lines = new Map<string, Line>();
for (const { day, event, automated, total, visits } of data) {
  const key = `${day} ${event}`;
  const line = lines.get(key) ?? {
    day: day.slice(0, 10),
    event,
    all: 0,
    people: 0,
    visits_all: 0,
    visits_people: 0,
  };
  line.all += Number(total);
  line.visits_all += Number(visits);
  if (automated !== "true") {
    line.people += Number(total);
    line.visits_people += Number(visits);
  }
  lines.set(key, line);
}

console.table([...lines.values()]);

// The product events by their fields, automated traffic left out.
const productEvents = [
  "new_sandbox",
  "launch_example",
  "create_script",
  "import_scripts",
  "compile_script",
  "simulate",
  "deploy_account",
];
const productQuery = `
  SELECT
    blob1 AS event,
    blob7 AS example_id,
    blob8 AS script_type,
    blob9 AS outcome,
    blob10 AS target,
    blob3 != '' AS in_tutorial,
    SUM(_sample_interval) AS people
  FROM miden_playground_events
  WHERE timestamp > NOW() - INTERVAL '${days}' DAY
    AND blob1 IN (${productEvents.map((name) => `'${name}'`).join(", ")})
    AND blob6 != 'true'
  GROUP BY event, example_id, script_type, outcome, target, in_tutorial
  ORDER BY event, people DESC
  FORMAT JSON
`;

type ProductRow = {
  event: string;
  example_id: string;
  script_type: string;
  outcome: string;
  target: string;
  in_tutorial: string | number | boolean;
  people: string | number;
};
console.table(
  (await runQuery<ProductRow>(productQuery)).map((row) => ({
    ...row,
    in_tutorial: [1, "1", true, "true"].includes(row.in_tutorial),
    people: Number(row.people),
  })),
);
