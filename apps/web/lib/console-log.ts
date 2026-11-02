import { useCallback, useSyncExternalStore } from "react";

// The editor console's log, per script. Kept in memory only: not in the app
// state, so it is neither persisted nor saved with projects. It survives
// switching scripts (the script page remounts per id) and tabs, not a reload.

export type ConsoleLevel = "info" | "success" | "warning" | "error";

export type ConsoleEntry = {
  id: string;
  timestamp: number;
  level: ConsoleLevel;
  // A one-line summary, e.g. `Compiled counter-account in 3.9 s.`.
  text: string;
  // The compiler output shown under the summary.
  output?: string;
  // Set on the entries of a compile result: their locations link to the
  // editor while they are the latest compile's.
  compile?: boolean;
};

const EMPTY: ConsoleEntry[] = [];

const logs = new Map<string, ConsoleEntry[]>();
const listeners = new Set<() => void>();

const notify = () => {
  for (const listener of listeners) {
    listener();
  }
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const appendConsoleEntry = (
  scriptId: string,
  entry: Omit<ConsoleEntry, "id" | "timestamp">,
) => {
  logs.set(scriptId, [
    ...(logs.get(scriptId) ?? EMPTY),
    { id: crypto.randomUUID(), timestamp: Date.now(), ...entry },
  ]);
  notify();
};

export const clearConsoleLog = (scriptId: string) => {
  logs.set(scriptId, EMPTY);
  notify();
};

// Whether the script's log was ever written to (cleared counts as written).
export const hasConsoleLog = (scriptId: string) => logs.has(scriptId);

export const useConsoleLog = (scriptId: string) => {
  const entries = useSyncExternalStore(
    subscribe,
    () => logs.get(scriptId) ?? EMPTY,
  );
  const append = useCallback(
    (entry: Omit<ConsoleEntry, "id" | "timestamp">) =>
      appendConsoleEntry(scriptId, entry),
    [scriptId],
  );
  const clear = useCallback(() => clearConsoleLog(scriptId), [scriptId]);
  return { entries, append, clear };
};

export const formatConsoleTime = (timestamp: number) =>
  new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

// The log as plain text, to copy it.
export const consoleLogText = (entries: ConsoleEntry[]) =>
  entries
    .map(({ timestamp, text, output }) =>
      [`[${formatConsoleTime(timestamp)}] ${text}`, output?.trimEnd()]
        .filter(Boolean)
        .join("\n"),
    )
    .join("\n\n");

export const formatDuration = (durationMs: number) =>
  `${(durationMs / 1000).toFixed(1)} s`;
