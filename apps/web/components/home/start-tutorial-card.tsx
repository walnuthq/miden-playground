import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@workspace/ui/components/alert-dialog";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { cn } from "@workspace/ui/lib/utils";
import { BadgeCheck, CircleDashed, RotateCcw } from "lucide-react";
import useTutorials from "@/hooks/use-tutorials";
import type { Tutorial } from "@/lib/types/tutorial";
import type { TutorialStatus } from "@/lib/utils/tutorial-status";

// A tutorial's card. Its buttons are disabled without their handlers: the app
// shell (shown while the Miden client initializes) renders it that way.
export const StartTutorialCardView = ({
  tutorial,
  status,
  completed,
  onStart,
  onRestart,
}: {
  tutorial: Tutorial;
  status: TutorialStatus | null;
  completed: boolean;
  onStart?: () => void;
  onRestart?: () => void;
}) => (
  <Card>
    <CardHeader className="gap-0">
      <div className="flex items-center justify-between">
        <strong className="text-primary text-sm">
          {tutorial.number.toString().padStart(2, "0")}
        </strong>
        <div className="flex items-center gap-2">
          {status && (
            <Badge variant="outline" className="text-sm">
              <CircleDashed />
              Step {status.step + 1} of {tutorial.steps.length}
            </Badge>
          )}
          {completed ? (
            <Badge className="text-sm bg-success text-success-foreground">
              <BadgeCheck />
              Completed
            </Badge>
          ) : (
            !status && (
              <Badge
                className={cn("capitalize text-sm", {
                  "bg-beginner text-beginner-foreground":
                    tutorial.category === "beginner",
                  "bg-advanced text-advanced-foreground":
                    tutorial.category === "advanced",
                })}
              >
                {tutorial.category}
              </Badge>
            )
          )}
        </div>
      </div>
      <CardTitle className="text-xl">{tutorial.title}</CardTitle>
      <CardDescription>{tutorial.tagline}</CardDescription>
    </CardHeader>
    <CardContent className="h-full">
      <p>{tutorial.description}</p>
    </CardContent>
    <CardFooter className="gap-2">
      <Button
        variant="outline"
        className="grow bg-muted/50"
        disabled={!onStart}
        onClick={onStart}
      >
        {status ? "Resume tutorial" : "Start tutorial"}
      </Button>
      {status && (
        <AlertDialog>
          <AlertDialogTrigger
            render={
              <Button
                variant="outline"
                size="icon"
                className="bg-muted/50"
                aria-label="Restart tutorial"
                title="Restart tutorial"
                disabled={!onRestart}
              />
            }
          >
            <RotateCcw />
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Restart {tutorial.title}?</AlertDialogTitle>
              <AlertDialogDescription>
                Your progress in this tutorial, with the accounts, notes and
                transactions you created in it, will be lost.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onRestart}>
                Restart tutorial
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </CardFooter>
  </Card>
);

const StartTutorialCard = ({ tutorial }: { tutorial: Tutorial }) => {
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
