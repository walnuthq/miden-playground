import { StartTutorialCardView } from "@/components/home/start-tutorial-card-view";
import useTutorials from "@/hooks/use-tutorials";
import type { TutorialMeta } from "@/lib/types/tutorial";

const StartTutorialCard = ({ tutorial }: { tutorial: TutorialMeta }) => {
  const { completedTutorials, tutorialStatus, startTutorial, restartTutorial } =
    useTutorials();
  return (
    <StartTutorialCardView
      tutorial={tutorial}
      status={tutorialStatus(tutorial.id)}
      completed={completedTutorials.has(tutorial.id)}
      onStart={() => startTutorial(tutorial.id)}
      onRestart={() => restartTutorial(tutorial.id)}
    />
  );
};

export default StartTutorialCard;
