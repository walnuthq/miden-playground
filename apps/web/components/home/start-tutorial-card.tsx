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
      <CardHeader className="gap-0">
        <div className="flex items-center justify-between">
          <strong className="text-[#ff5500] text-sm">
            {tutorial.number.toString().padStart(2, "0")}
          </strong>
          {completedTutorials.has(tutorial.id) ? (
            <Badge className="text-sm bg-green-500 text-white dark:bg-green-600">
              <BadgeCheck />
              Completed
            </Badge>
          ) : (
            <Badge
              className={cn("capitalize text-sm text-white", {
                "bg-[#588EFB] dark:bg-sky-600":
                  tutorial.category === "beginner",
                "bg-[#9D00FF] dark:bg-amber-600":
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
          className="w-full bg-[#f9f9f9]"
          onClick={() => startTutorial(tutorial.id)}
        >
          Start tutorial
        </Button>
      </CardFooter>
    </Card>
  );
};

export default StartTutorialCard;
