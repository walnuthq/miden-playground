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

const StartTutorialCard = ({ tutorial }: { tutorial: Tutorial }) => {
  const { completedTutorials, startTutorial } = useTutorials();
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {tutorial.number}. {tutorial.title}
        </CardTitle>
        <CardAction>
          {completedTutorials.has(tutorial.number) && (
            <Badge
              variant="secondary"
              className="text-sm bg-green-500 text-white dark:bg-green-600"
            >
              <BadgeCheck />
              Completed
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
