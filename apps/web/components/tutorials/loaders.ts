import { tutorialMeta } from "@/components/tutorials/meta";
import type { Tutorial, TutorialId } from "@/lib/types/tutorial";

type LoadableTutorialId = Exclude<TutorialId, "">;

// One dynamic import per tutorial: its steps and state load when it's opened,
// not with every page. meta.ts lists the same ids, in order.
const loaders: Record<
  LoadableTutorialId,
  () => Promise<{ default: Tutorial }>
> = {
  "create-and-fund-wallet": () =>
    import("@/components/tutorials/create-and-fund-wallet"),
  "transfer-assets-between-wallets": () =>
    import("@/components/tutorials/transfer-assets-between-wallets"),
  "connect-wallet-and-sign-transactions": () =>
    import("@/components/tutorials/connect-wallet-and-sign-transactions"),
  "private-transfers": () => import("@/components/tutorials/private-transfers"),
  "wallet-backup-using-miden-guardian": () =>
    import("@/components/tutorials/wallet-backup-using-miden-guardian"),
  "interact-with-the-counter-contract": () =>
    import("@/components/tutorials/interact-with-the-counter-contract"),
  "deploy-a-counter-contract": () =>
    import("@/components/tutorials/deploy-a-counter-contract"),
  "timelock-p2id-note": () =>
    import("@/components/tutorials/timelock-p2id-note"),
  "network-transactions": () =>
    import("@/components/tutorials/network-transactions"),
  "foreign-procedure-invocation": () =>
    import("@/components/tutorials/foreign-procedure-invocation"),
  "your-first-smart-contract-and-custom-note": () =>
    import("@/components/tutorials/your-first-smart-contract-and-custom-note"),
  "contract-verification": () =>
    import("@/components/tutorials/contract-verification"),
};

const loaded = new Map<LoadableTutorialId, Promise<Tutorial>>();

export const loadTutorial = (id: TutorialId) => {
  if (id === "") {
    return Promise.reject(new Error("No tutorial to load"));
  }
  let tutorial = loaded.get(id);
  if (!tutorial) {
    tutorial = loaders[id]().then(({ default: tutorial }) => {
      // The metadata (meta.ts) stands in for the tutorial where it isn't
      // loaded: keep the two in step. Dev only, so it fails fast locally and
      // in the e2e runs against the dev server.
      if (
        import.meta.env.DEV &&
        tutorial.steps.length !== tutorialMeta(id).stepCount
      ) {
        throw new Error(
          `tutorials/meta.ts says tutorial "${id}" has ${tutorialMeta(id).stepCount} steps, it has ${tutorial.steps.length}`,
        );
      }
      return tutorial;
    });
    // A failed chunk load (offline, a deploy in between) can be retried.
    tutorial.catch(() => loaded.delete(id));
    loaded.set(id, tutorial);
  }
  return tutorial;
};
