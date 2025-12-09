export const saEvent = (
  event: string,
  metadata: Record<string, string | boolean | number | Date>
) => {
  window.sa_event?.(event, metadata);
  console.info("sa_event", event, metadata);
};
