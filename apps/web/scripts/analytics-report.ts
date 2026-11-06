// Daily counts from Analytics Engine, for the trial in spec/analytics-trial.md.
//
//   pnpm analytics:report [days, default 30]
//
// Needs ANALYTICS_ACCOUNT_ID and ANALYTICS_API_TOKEN (Account Analytics Read) in
// the environment or .env.local. `people` leaves out automated traffic (e2e, the
// status page's probe, QA). Compare it with Simple Analytics' and Web Analytics'
// dashboards over the same dates, in UTC.
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

const response = await fetch(
  `https://api.cloudflare.com/client/v4/accounts/${ANALYTICS_ACCOUNT_ID}/analytics_engine/sql`,
  {
    method: "POST",
    headers: { authorization: `Bearer ${ANALYTICS_API_TOKEN}` },
    body: query,
  },
);
if (!response.ok) {
  throw new Error(
    `Analytics Engine: ${response.status} ${await response.text()}`,
  );
}

type Row = {
  day: string;
  event: string;
  automated: string;
  total: string | number;
  visits: string | number;
};
const { data } = (await response.json()) as { data: Row[] };

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
