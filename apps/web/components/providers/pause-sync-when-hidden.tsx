import { useSyncControl, useSyncState } from "@miden-sdk/react";
import { useEffect, useRef } from "react";
import useDocumentVisible from "@/hooks/use-document-visible";

// Pauses MidenProvider's auto-sync (every 5 s) while the tab is hidden, where
// it would keep querying the node and the note transport for nobody, and
// syncs as soon as the tab shows again. (NetworkBadge stops the app's own
// sync loop.) Pauses only an auto-sync that isn't paused yet, and resumes only
// its own pause: a Para transaction pauses it too (submitParaTransaction).
// Flows waiting for a transaction don't depend on it: useWaitForCommit and
// the faucet waits sync in loops of their own.
const PauseSyncWhenHidden = () => {
  const visible = useDocumentVisible();
  const { pauseSync, resumeSync, isPaused } = useSyncControl();
  const { sync } = useSyncState();
  const ownsPause = useRef(false);
  useEffect(() => {
    if (!visible) {
      if (!isPaused) {
        ownsPause.current = true;
        pauseSync();
      }
      return;
    }
    if (ownsPause.current) {
      ownsPause.current = false;
      resumeSync();
      sync().catch(console.error);
    }
  }, [visible, isPaused, pauseSync, resumeSync, sync]);
  // The pause is the SDK store's, which outlives this component: don't leave
  // the client paused when unmounted. (A network switch doesn't unmount it:
  // the providers stay above MidenClientGate.)
  useEffect(
    () => () => {
      if (ownsPause.current) {
        ownsPause.current = false;
        resumeSync();
      }
    },
    [resumeSync],
  );
  return null;
};

export default PauseSyncWhenHidden;
