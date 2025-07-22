import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import useTutorials from "@/hooks/use-tutorials";
import { type Tutorial } from "@/lib/types";

const StartTutorialCard = ({ tutorial }: { tutorial: Tutorial }) => {
  const { startTutorial } = useTutorials();
  return (
    <Card>
      <CardHeader>
        <CardTitle>{tutorial.title}</CardTitle>
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
