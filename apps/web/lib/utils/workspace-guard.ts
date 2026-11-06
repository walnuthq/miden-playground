import { useSyncExternalStore } from "react";

// The workspace as last rendered, written by GlobalContextProvider, which stays
// mounted through a network switch. Nothing cancels work started in a workspace
// (a save, a deploy), so it checks here whether that workspace is still current.
const live = { workspaceRun: 0, switching: false };

export const setLiveWorkspace = (workspaceRun: number, switching: boolean) => {
  live.workspaceRun = workspaceRun;
  live.switching = switching;
};

// Whether the workspace of `workspaceRun` was left, or is being replaced.
export const workspaceLeft = (workspaceRun: number) =>
  live.switching || live.workspaceRun !== workspaceRun;

// Bread Wallet funding a Mainnet account with real USDCX. Leaving the workspace
// meanwhile loses the account with its store, and what was sent to it, so a
// switch asks first (SwitchWorkspaceAlertDialog).
export type MainnetFunding = { abandoned: boolean };

const fundings = new Set<MainnetFunding>();
let answerWarning: ((confirmed: boolean) => void) | null = null;
const listeners = new Set<() => void>();

const notify = () => {
  for (const listener of listeners) {
    listener();
  }
};

export const startMainnetFunding = () => {
  const funding: MainnetFunding = { abandoned: false };
  fundings.add(funding);
  return funding;
};

// With no funding left, a warning still open has nothing to warn about. It
// closes and the workspace stays: the switch only ever goes on when confirmed.
export const endMainnetFunding = (funding: MainnetFunding) => {
  fundings.delete(funding);
  if (fundings.size === 0) {
    answerWarning?.(false);
  }
};

// Whether a workspace switch can go on: right away without a funding running,
// else what the user answers to the warning. A funding left this way doesn't
// warn again.
export const confirmWorkspaceSwitch = () => {
  if (fundings.size === 0) {
    return Promise.resolve(true);
  }
  answerWarning?.(false);
  return new Promise<boolean>((resolve) => {
    answerWarning = (confirmed) => {
      answerWarning = null;
      if (confirmed) {
        for (const funding of fundings) {
          funding.abandoned = true;
        }
        fundings.clear();
      }
      resolve(confirmed);
      notify();
    };
    notify();
  });
};

export const answerWorkspaceSwitchWarning = (confirmed: boolean) =>
  answerWarning?.(confirmed);

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const useWorkspaceSwitchWarningOpen = () =>
  useSyncExternalStore(subscribe, () => answerWarning !== null);
