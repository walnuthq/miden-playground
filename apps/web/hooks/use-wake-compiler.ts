import { useEffect } from "react";
import { compilerWake } from "@/lib/api";

// Wakes api-compile when the script page opens, and when the user comes back to
// it (window focus, tab shown) after `WAKE_INTERVAL_MS` without a wake or a
// compile (lib/compiler-wake.ts).
const useWakeCompiler = () => {
  useEffect(() => {
    compilerWake.wakeIfIdle();
    const onFocus = () => compilerWake.wakeIfIdle();
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        compilerWake.wakeIfIdle();
      }
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);
};

export default useWakeCompiler;
