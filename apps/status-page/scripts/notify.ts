import "dotenv/config";
import fs from "node:fs";
import path from "node:path";

import type {
  ServiceHealth,
  ServiceStatus,
  StatusSnapshot,
} from "../src/lib/types.js";

// Posts to Slack when a service's health changes. Runs after scripts/probe.ts
// (see .github/workflows/deploy-status-page.yml) and is a **pure reader** of
// public/status.json — it writes nothing, which is why it can run after
// `vite build` without the deployed snapshot and the notification disagreeing.
//
// The whole design goal is silence. A 30-minute cron with no memory would post
// 48 identical "web is down" messages a day, so this only speaks when the state
// changes, plus a reminder every 6 hours while an outage continues.
//
// It never fails the build: no webhook, an unreachable Slack, a malformed
// snapshot — all log and exit 0.

const WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL ?? "";
const DRY_RUN = process.argv.includes("--dry-run");

const SIX_HOURS_MS = 6 * 60 * 60 * 1000;
const SLACK_TIMEOUT_MS = 10_000;

// Slack's own palette, so the attachment stripe reads the same as every other
// alert in the workspace. `blocked` is grey on purpose — it is not an incident,
// and colouring it red would page someone for a firewall setting.
const colors: Record<ServiceHealth, string> = {
  healthy: "#2eb67d",
  degraded: "#ecb22e",
  unhealthy: "#e01e5a",
  blocked: "#868686",
};

const icons: Record<ServiceHealth, string> = {
  healthy: "✅",
  degraded: "🟡",
  unhealthy: "🔴",
  blocked: "🚧",
};

/** "1h 30m", "45m", "6h" — outage durations, not precise timings. */
const formatDuration = (ms: number) => {
  const minutes = Math.max(0, Math.round(ms / 60_000));
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (hours === 0) return `${remainder}m`;
  if (remainder === 0) return `${hours}h`;
  return `${hours}h ${remainder}m`;
};

const CODE_FENCE = "```";

/** Slack rejects a section whose text exceeds 3000 characters. */
const truncate = (text: string, limit = 2900) =>
  text.length <= limit
    ? text
    : `${text.slice(0, limit)}\n… truncated${CODE_FENCE}`;

const formatTimestamp = (iso: string) =>
  `${new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(iso))} UTC`;

type Reason =
  | { kind: "changed" }
  | { kind: "first-sighting" }
  | { kind: "reminder"; downFor: string };

/**
 * The state machine, expressed as a pure function so every branch is reachable
 * from a hand-written snapshot in testing.
 *
 * Reminders are *derived* rather than stored: crossing a 6-hour boundary
 * measured from `since` is what makes one due. Nothing is persisted, so a lost
 * or failed deploy cannot desynchronise the cadence — the next run recomputes
 * it from the same two timestamps.
 */
const reasonToPost = (
  service: ServiceStatus,
  snapshot: StatusSnapshot,
): Reason | null => {
  const { health, previousHealth, since } = service;

  if (previousHealth === null) {
    // No previous snapshot: the first deploy, or a fetch that failed. Announce
    // a bad state (it is news to the channel) and stay quiet about a good one.
    return health === "healthy" ? null : { kind: "first-sighting" };
  }

  if (previousHealth !== health) return { kind: "changed" };
  if (health === "healthy") return null;

  // Unchanged and still bad — a reminder is due only when this run is the first
  // one past a 6-hour multiple of the outage.
  const { checkedAt, previousCheckedAt } = snapshot;
  if (!previousCheckedAt) return null;
  const start = new Date(since).getTime();
  const now = new Date(checkedAt).getTime();
  const before = new Date(previousCheckedAt).getTime();
  if (
    !Number.isFinite(start) ||
    !Number.isFinite(now) ||
    !Number.isFinite(before)
  ) {
    return null;
  }
  const crossed =
    Math.floor((now - start) / SIX_HOURS_MS) >
    Math.floor((before - start) / SIX_HOURS_MS);
  return crossed
    ? { kind: "reminder", downFor: formatDuration(now - start) }
    : null;
};

/** Present tense, without the word "down", for each non-healthy state. */
const states: Record<Exclude<ServiceHealth, "healthy">, string> = {
  unhealthy: "down",
  degraded: "degraded",
  blocked: "unmeasurable",
};

const headline = (service: ServiceStatus, reason: Reason) => {
  const icon = icons[service.health];
  if (service.health === "healthy") {
    // Coming back from a block is not a recovery — nothing was ever known to be
    // broken, the probe just could not see.
    return service.previousHealth === "blocked"
      ? `${icon} ${service.name} is measurable again`
      : `${icon} ${service.name} recovered`;
  }
  const state = states[service.health];
  return reason.kind === "reminder"
    ? `${icon} ${service.name} is still ${state} (${reason.downFor})`
    : `${icon} ${service.name} is ${state}`;
};

const summaryLine = (
  service: ServiceStatus,
  reason: Reason,
  checkedAt: string,
) => {
  // The link the reader wants first: the page that is actually broken.
  const link = `<${service.url}|${service.url.replace(/^https?:\/\//, "")}>`;

  const elapsed = formatDuration(
    new Date(checkedAt).getTime() - new Date(service.since).getTime(),
  );

  if (service.health === "healthy") {
    return service.previousHealth === "blocked"
      ? `*${link}* — the probe is getting through again, and all ${service.endpoints.length} checks pass. It was unmeasurable for ${elapsed}.`
      : `*${link}* is back — all ${service.endpoints.length} checks passing after ${elapsed} down.`;
  }

  if (service.health === "blocked") {
    // The single most important sentence this script can say: do not go and
    // wake someone up over a firewall.
    return `*${link}* — the probe was blocked before it could measure anything, so this is *not* a confirmed outage. Check the firewall (Vercel Attack Mode challenges CI runners) before treating it as one.`;
  }

  const total = service.endpoints.length;
  const failing = service.endpoints.filter(
    (endpoint) => endpoint.health !== "healthy",
  ).length;
  const when =
    reason.kind === "reminder"
      ? `since ${formatTimestamp(service.since)}`
      : `as of ${formatTimestamp(checkedAt)}`;
  return `*${link}* — ${failing} of ${total} ${total === 1 ? "check" : "checks"} failing ${when}.`;
};

const attachmentFor = (
  service: ServiceStatus,
  reason: Reason,
  snapshot: StatusSnapshot,
  links: string,
) => {
  const failing = service.endpoints.filter(
    (endpoint) => endpoint.health !== "healthy",
  );

  return {
    color: colors[service.health],
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: headline(service, reason),
          emoji: true,
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: summaryLine(service, reason, snapshot.checkedAt),
        },
      },
      // The probe's one-line errors are the whole diagnosis; a code block keeps
      // them readable and stops Slack mangling URLs into links.
      ...(failing.length > 0
        ? [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: truncate(
                  CODE_FENCE +
                    failing
                      .map((endpoint) => `${endpoint.label}: ${endpoint.error}`)
                      .join("\n") +
                    CODE_FENCE,
                ),
              },
            },
          ]
        : []),
      // Omitted entirely when empty: Slack rejects a block whose text is an
      // empty string, which is what running outside Actions produces.
      ...(links
        ? [{ type: "context", elements: [{ type: "mrkdwn", text: links }] }]
        : []),
    ],
  };
};

/** Status page and workflow run, shown small under each attachment. */
const contextLinks = () => {
  const parts: string[] = [];
  const statusPage = process.env.STATUS_PAGE_URL;
  const { GITHUB_SERVER_URL, GITHUB_REPOSITORY, GITHUB_RUN_ID } = process.env;

  if (statusPage) {
    parts.push(`<${statusPage}|Status page>`);
  } else if (GITHUB_REPOSITORY) {
    const [owner, name] = GITHUB_REPOSITORY.split("/");
    if (owner && name) {
      parts.push(
        `<https://${owner.toLowerCase()}.github.io/${name}/|Status page>`,
      );
    }
  }
  if (GITHUB_SERVER_URL && GITHUB_REPOSITORY && GITHUB_RUN_ID) {
    parts.push(
      `<${GITHUB_SERVER_URL}/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID}|Workflow run>`,
    );
  }
  return parts.join("  ·  ");
};

const readSnapshot = (): StatusSnapshot | null => {
  const file = path.resolve(import.meta.dirname, "..", "public", "status.json");
  try {
    const snapshot = JSON.parse(
      fs.readFileSync(file, "utf8"),
    ) as StatusSnapshot;
    if (!Array.isArray(snapshot.services)) {
      console.log(`${file} has no services array — nothing to notify about`);
      return null;
    }
    return snapshot;
  } catch (error) {
    console.log(
      `could not read ${file}: ${error instanceof Error ? error.message : "unknown error"}`,
    );
    console.log("run `pnpm probe` first");
    return null;
  }
};

const snapshot = readSnapshot();

if (snapshot) {
  const posts = snapshot.services
    .map((service) => ({ service, reason: reasonToPost(service, snapshot) }))
    .filter(
      (entry): entry is { service: ServiceStatus; reason: Reason } =>
        entry.reason !== null,
    );

  for (const { service, reason } of posts) {
    console.log(
      `${service.name}: ${reason.kind} → ${headline(service, reason)}`,
    );
  }

  if (posts.length === 0) {
    console.log("nothing to report — no health changes since the last run");
  } else {
    const links = contextLinks();
    const payload = {
      // Shown in notifications and by clients that cannot render blocks.
      text: posts
        .map(({ service, reason }) => headline(service, reason))
        .join(", "),
      attachments: posts.map(({ service, reason }) =>
        attachmentFor(service, reason, snapshot, links),
      ),
    };

    if (DRY_RUN || !WEBHOOK_URL) {
      console.log(
        DRY_RUN
          ? "--dry-run: the payload below was not sent"
          : "SLACK_WEBHOOK_URL is not set — skipping the post",
      );
      console.log(JSON.stringify(payload, null, 2));
    } else {
      try {
        const response = await fetch(WEBHOOK_URL, {
          method: "POST",
          signal: AbortSignal.timeout(SLACK_TIMEOUT_MS),
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        });
        // Slack answers `ok` in the body, and an error as plain text.
        const body = (await response.text()).trim();
        console.log(
          response.ok && body === "ok"
            ? `posted ${posts.length} notification(s) to Slack`
            : `Slack rejected the message: HTTP ${response.status} ${body}`,
        );
      } catch (error) {
        // A Slack outage must never take the status page down with it.
        console.log(
          `could not reach Slack: ${error instanceof Error ? error.message : "unknown error"}`,
        );
      }
    }
  }
}
