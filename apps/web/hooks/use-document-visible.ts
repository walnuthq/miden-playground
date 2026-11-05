import { useSyncExternalStore } from "react";

const subscribe = (listener: () => void) => {
  document.addEventListener("visibilitychange", listener);
  return () => document.removeEventListener("visibilitychange", listener);
};

const getVisible = () => document.visibilityState === "visible";

// Whether the page's tab is shown: false while it's in the background, or the
// window is minimized.
const useDocumentVisible = () => useSyncExternalStore(subscribe, getVisible);

export default useDocumentVisible;
