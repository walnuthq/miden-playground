// Simple Analytics custom events. A no-op when its script (/proxy.js, served by
// the Worker) isn't loaded, e.g. under `vite`.
export const trackEvent = (name: string, metadata?: Record<string, unknown>) =>
  window.sa_event?.(name, metadata);
