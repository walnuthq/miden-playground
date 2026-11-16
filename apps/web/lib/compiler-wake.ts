// api-compile's container sleeps after 5 minutes without requests, and the
// first compile after that waits a few seconds for it to start. The script page
// wakes it through the API (`POST /wake`) when it opens, and again when the user
// comes back to it after a while, so it's awake for the next compile.

// Wake again past this since the last wake or compile: under the container's
// 5 minutes, so it's woken before it sleeps from the user's point of view. It's
// also the most a tab ever calls the route.
export const WAKE_INTERVAL_MS = 4 * 60_000;

// `wakeIfIdle` calls `wake` unless the last call, or a compile (`compiled`),
// was less than `intervalMs` ago.
export const createCompilerWake = ({
  wake,
  intervalMs = WAKE_INTERVAL_MS,
  now = Date.now,
}: {
  wake: () => void;
  intervalMs?: number;
  now?: () => number;
}) => {
  let lastWakeAt = Number.NEGATIVE_INFINITY;
  let lastCompileAt = Number.NEGATIVE_INFINITY;
  return {
    wakeIfIdle: () => {
      const time = now();
      if (time - lastWakeAt < intervalMs || time - lastCompileAt < intervalMs) {
        return false;
      }
      lastWakeAt = time;
      wake();
      return true;
    },
    // A compile keeps the container awake as a wake does.
    compiled: () => {
      lastCompileAt = now();
    },
  };
};
