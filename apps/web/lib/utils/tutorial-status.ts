import type { TutorialProgress } from "@/lib/types/project";
import type { TutorialId } from "@/lib/types/tutorial";

export type TutorialStatus = {
  step: number;
  maxStep: number;
  // The tutorial in progress, as opposed to one left unfinished.
  active: boolean;
};

// A tutorial's progress: the live state for the active tutorial, its saved
// progress for one left unfinished, null otherwise. Reads the app state only,
// so the app shell can show it before the Miden client is ready.
export const tutorialStatus = (
  {
    tutorialId,
    tutorialStep,
    tutorialMaxStep,
    tutorialProgress,
  }: {
    tutorialId: TutorialId;
    tutorialStep: number;
    tutorialMaxStep: number;
    tutorialProgress: Partial<Record<TutorialId, TutorialProgress>>;
  },
  id: TutorialId,
): TutorialStatus | null => {
  if (id !== "" && id === tutorialId) {
    return { step: tutorialStep, maxStep: tutorialMaxStep, active: true };
  }
  const progress = tutorialProgress[id];
  return progress
    ? { step: progress.step, maxStep: progress.maxStep, active: false }
    : null;
};
