import { BadgeCheck } from "lucide-react";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";
import useTutorials from "@/hooks/use-tutorials";
import { type Tutorial } from "@/lib/types/tutorial";
import { cn } from "@workspace/ui/lib/utils";

const StartTutorialCard = ({ tutorial }: { tutorial: Tutorial }) => {
  const { completedTutorials, startTutorial } = useTutorials();
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {tutorial.number}. {tutorial.title}
        </CardTitle>
        <CardAction>
          {completedTutorials.has(tutorial.id) ? (
            <Badge className="text-sm bg-green-500 text-white dark:bg-green-600">
              <BadgeCheck />
              Completed
            </Badge>
          ) : (
            <Badge
              className={cn("capitalize text-sm text-white", {
                "bg-sky-500 dark:bg-sky-600": tutorial.category === "beginner",
                "bg-amber-500 dark:bg-amber-600":
                  tutorial.category === "advanced",
              })}
            >
              {tutorial.category}
            </Badge>
          )}
        </CardAction>
        <CardDescription>{tutorial.tagline}</CardDescription>
      </CardHeader>
      <CardContent className="h-full">
        <p>{tutorial.description}</p>
      </CardContent>
      <CardFooter>
        <Button className="w-full" onClick={() => startTutorial(tutorial.id)}>
          Start tutorial
        </Button>
      </CardFooter>
    </Card>
  );
};

export default StartTutorialCard;
