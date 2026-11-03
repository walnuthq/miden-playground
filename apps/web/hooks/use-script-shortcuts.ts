import { useEffect, useRef } from "react";

// Cmd on macOS (and iOS), Ctrl elsewhere. `navigator.platform` is the real OS
// (`userAgentData` follows an emulated user agent, e.g. Playwright's devices).
export const isMac = /mac|iphone|ipad/i.test(navigator.platform);

// A shortcut as its tooltip shows it: `⌘S` on macOS, `Ctrl+S` elsewhere.
export const shortcutLabel = (key: string) =>
  isMac ? `⌘${key}` : `Ctrl+${key}`;

type Handlers = {
  onCompile: () => void;
  onToggleConsole: () => void;
  onClearConsole: () => void;
};

// The script page's keyboard shortcuts: Cmd/Ctrl+S and Cmd/Ctrl+Enter compile,
// Cmd/Ctrl+J toggles the console, Cmd/Ctrl+L clears it. One capture listener on
// the window rather than Monaco's `addCommand`: they work wherever the focus
// is, standalone Monaco shares `addCommand` bindings across its editors (the
// page has two), and the capture phase runs before Monaco's own bindings
// (Cmd+Enter inserts a line, Cmd+L selects one) and stops the browser's (save
// page, address bar, downloads).
const useScriptShortcuts = ({
  enabled,
  ...handlers
}: Handlers & { enabled: boolean }) => {
  // The latest handlers, so the listener is attached once.
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;
  useEffect(() => {
    if (!enabled) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        !(isMac ? event.metaKey : event.ctrlKey) ||
        event.altKey ||
        event.shiftKey
      ) {
        return;
      }
      const action = (
        {
          s: "onCompile",
          enter: "onCompile",
          j: "onToggleConsole",
          l: "onClearConsole",
        } as const
      )[event.key.toLowerCase()];
      if (!action) {
        return;
      }
      // An open dialog (e.g. Add dependency) keeps its keys, but the browser
      // never saves the page.
      const inDialog =
        event.target instanceof Element &&
        event.target.closest('[role="dialog"]') !== null;
      if (inDialog && event.key.toLowerCase() !== "s") {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      if (inDialog || event.repeat) {
        return;
      }
      handlersRef.current[action]();
    };
    window.addEventListener("keydown", onKeyDown, { capture: true });
    return () =>
      window.removeEventListener("keydown", onKeyDown, { capture: true });
  }, [enabled]);
};

export default useScriptShortcuts;
