import {
  CircleAlert,
  CircleCheck,
  ShieldQuestion,
  TriangleAlert,
} from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert";

import { formatTimestamp } from "@/lib/format";
import type { ServiceStatus } from "@/lib/types";

const countChecks = (services: ServiceStatus[]) =>
  services.reduce((total, service) => total + service.endpoints.length, 0);

const describe = (service: ServiceStatus) => {
  const failing = service.endpoints.filter(
    (endpoint) => endpoint.health !== "healthy",
  ).length;
  return `${service.name} (${failing} of ${service.endpoints.length} checks failing)`;
};

const names = (services: ServiceStatus[]) =>
  services.map((service) => service.name).join(", ");

/**
 * Blocked services are named separately everywhere, because folding them into a
 * count of failures would report a firewall as an outage — the mistake this
 * state exists to prevent.
 */
const blockedNote = (blocked: ServiceStatus[]) =>
  blocked.length === 0
    ? ""
    : ` Could not measure ${names(blocked)} — the probe was blocked before reaching ${blocked.length === 1 ? "it" : "them"}.`;

const OverallStatus = ({
  checkedAt,
  services,
}: {
  checkedAt: string;
  services: ServiceStatus[];
}) => {
  const degraded = services.filter((service) => service.health === "degraded");
  const down = services.filter((service) => service.health === "unhealthy");
  const blocked = services.filter((service) => service.health === "blocked");
  const checked = `Last checked ${formatTimestamp(checkedAt)}.`;

  if (degraded.length === 0 && down.length === 0 && blocked.length === 0) {
    return (
      <Alert className="border-green-600/50 text-green-700 dark:border-green-500/50 dark:text-green-400">
        <CircleCheck />
        <AlertTitle>All systems operational</AlertTitle>
        <AlertDescription className="text-green-700/90 dark:text-green-400/90">
          All {countChecks(services)} checks across {services.length} services
          passed. {checked}
        </AlertDescription>
      </Alert>
    );
  }

  // Anything fully down outranks a partial failure.
  if (down.length > 0) {
    return (
      // The destructive variant paints itself with `--destructive`, which is a
      // deep fill red in dark mode; `--destructive-foreground` is the readable
      // one. Both selectors are needed because the variant styles the
      // description through a child selector that a class here would lose to.
      <Alert
        variant="destructive"
        className="dark:text-destructive-foreground dark:*:data-[slot=alert-description]:text-destructive-foreground/90"
      >
        <CircleAlert />
        <AlertTitle>
          {down.length} of {services.length} services{" "}
          {down.length === 1 ? "is" : "are"} unhealthy
        </AlertTitle>
        <AlertDescription>
          {[
            ...down.map((service) => service.name),
            ...degraded.map(describe),
          ].join(", ")}
          . {checked}
          {blockedNote(blocked)}
        </AlertDescription>
      </Alert>
    );
  }

  if (degraded.length > 0) {
    return (
      <Alert className="border-amber-600/50 text-amber-700 dark:border-amber-500/50 dark:text-amber-400">
        <TriangleAlert />
        <AlertTitle>
          {degraded.length} of {services.length} services{" "}
          {degraded.length === 1 ? "is" : "are"} degraded
        </AlertTitle>
        <AlertDescription className="text-amber-700/90 dark:text-amber-400/90">
          {degraded.map(describe).join(", ")}. {checked}
          {blockedNote(blocked)}
        </AlertDescription>
      </Alert>
    );
  }

  // Only blocked services left. Deliberately neutral rather than alarming: the
  // probe was turned away, which is a fact about the monitoring path and says
  // nothing about whether these services are serving traffic.
  return (
    <Alert className="border-muted-foreground/40 text-muted-foreground">
      <ShieldQuestion />
      <AlertTitle>
        Status unknown for {blocked.length} of {services.length}{" "}
        {services.length === 1 ? "service" : "services"}
      </AlertTitle>
      <AlertDescription className="text-muted-foreground">
        The probe was blocked before it could measure {names(blocked)} — most
        likely a firewall challenge rather than an outage. Everything else
        passed. {checked}
      </AlertDescription>
    </Alert>
  );
};

export default OverallStatus;
