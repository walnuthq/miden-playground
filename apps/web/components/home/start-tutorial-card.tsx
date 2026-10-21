import { BadgeCheck } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";
import useTutorials from "@/hooks/use-tutorials";
import type { Tutorial } from "@/lib/types/tutorial";
import { cn } from "@workspace/ui/lib/utils";

const StartTutorialCard = ({ tutorial }: { tutorial: Tutorial }) => {
  const { completedTutorials, startTutorial } = useTutorials();
  return (
    <Card>
      <CardHeader className="gap-0">
        <div className="flex items-center justify-between">
          <strong className="text-primary text-sm">
            {tutorial.number.toString().padStart(2, "0")}
          </strong>
          {completedTutorials.has(tutorial.id) ? (
            <Badge className="text-sm bg-success text-success-foreground">
              <BadgeCheck />
              Completed
            </Badge>
          ) : (
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
          )}
        </div>
        <CardTitle className="text-xl">{tutorial.title}</CardTitle>
        <CardDescription>{tutorial.tagline}</CardDescription>
      </CardHeader>
      <CardContent className="h-full">
        <p>{tutorial.description}</p>
      </CardContent>
      <CardFooter>
        <Button
          variant="outline"
          className="w-full bg-muted/50"
          onClick={() => startTutorial(tutorial.id)}
        >
          Start tutorial
        </Button>
      </CardFooter>
    </Card>
  );
};

export default StartTutorialCard;
