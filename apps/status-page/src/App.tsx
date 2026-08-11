import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert";

import ModeToggle from "@/components/mode-toggle";
import OverallStatus from "@/components/overall-status";
import ServiceCard from "@/components/service-card";
import type { StatusSnapshot } from "@/lib/types";

const PLAYGROUND_URL = "https://playground.miden.xyz";

type LoadState =
  | { phase: "loading" }
  | { phase: "ready"; snapshot: StatusSnapshot }
  | { phase: "error"; message: string };

const App = () => {
  const [state, setState] = useState<LoadState>({ phase: "loading" });

  useEffect(() => {
    const controller = new AbortController();

    // Written by scripts/probe.ts at build time into public/, so Vite copies it
    // into dist/ next to index.html. Same-origin, so no CORS involved.
    fetch(`${import.meta.env.BASE_URL}status.json`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status} fetching status.json`);
        }
        return (await response.json()) as StatusSnapshot;
      })
      .then((snapshot) => setState({ phase: "ready", snapshot }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }
        setState({
          phase: "error",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      });

    return () => controller.abort();
  }, []);

  return (
    <div className="min-h-svh bg-muted/20">
      <header className="border-b bg-background">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 px-4 py-4">
          <h1 className="font-medium">
            Miden Playground Status
            <span className="ml-1 inline-block size-2 bg-[#ff5500]" />
          </h1>
          <div className="flex items-center gap-3">
            <a
              href={PLAYGROUND_URL}
              target="_blank"
              rel="noreferrer noopener"
              className="text-xs underline-offset-4 hover:underline"
            >
              playground.miden.xyz
            </a>
            <ModeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10">
        {state.phase === "loading" && (
          <div className="flex items-center justify-center gap-2 py-16 text-xs text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading status…
          </div>
        )}

        {state.phase === "error" && (
          <Alert
            variant="destructive"
            className="dark:text-destructive-foreground dark:*:data-[slot=alert-description]:text-destructive-foreground/90"
          >
            <AlertTitle>Status unavailable</AlertTitle>
            <AlertDescription>
              Could not load the latest status snapshot. {state.message}
            </AlertDescription>
          </Alert>
        )}

        {state.phase === "ready" && (
          <>
            <OverallStatus
              checkedAt={state.snapshot.checkedAt}
              services={state.snapshot.services}
            />
            <div className="flex flex-col gap-4">
              {state.snapshot.services.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Checks run every 30 minutes from GitHub Actions — the web app is
              probed with a real headless browser, so what you see here is what
              a visitor would get. This page is a snapshot from the last run,
              not a live probe.
            </p>
          </>
        )}
      </main>
    </div>
  );
};

export default App;
