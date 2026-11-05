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
import { useState } from "react";
import type { TutorialMeta } from "@/lib/types/tutorial";
import type { TutorialStatus } from "@/lib/utils/tutorial-status";

// A tutorial's card, from its metadata (tutorials/meta.ts). Its buttons are
// disabled without their handlers: the app shell renders it that way, before
// the SDK loads, so this module stays SDK-free.
export const StartTutorialCardView = ({
  tutorial,
  status,
  completed,
  onStart,
  onRestart,
}: {
  tutorial: TutorialMeta;
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
              Step {status.step + 1} of {tutorial.stepCount}
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
        <RestartTutorialButton title={tutorial.title} onRestart={onRestart} />
      )}
    </CardFooter>
  </Card>
);

const RestartTutorialButton = ({
  title,
  onRestart,
}: {
  title: string;
  onRestart?: () => void;
}) => {
  const [open, setOpen] = useState(false);
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
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
          <AlertDialogTitle>Restart {title}?</AlertDialogTitle>
          <AlertDialogDescription>
            Your progress in this tutorial, with the accounts, notes and
            transactions you created in it, will be lost.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              // AlertDialogAction is a plain button, not a close trigger.
              setOpen(false);
              onRestart?.();
            }}
          >
            Restart tutorial
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
