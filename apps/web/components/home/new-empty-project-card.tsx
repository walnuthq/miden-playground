import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import useGlobalContext from "@/components/global-context/hook";

const NewEmptyProjectCard = () => {
  const { resetState } = useGlobalContext();
  return (
    <Card>
      <CardHeader>
        <CardTitle>New empty sandbox</CardTitle>
        <CardDescription>Start a new sandbox from scratch.</CardDescription>
      </CardHeader>
      <CardContent className="h-full">
        <p>Choose this option to create a new empty sandbox from scratch.</p>
      </CardContent>
      <CardFooter>
        <Button className="w-full" onClick={() => resetState()}>
          Create new sandbox
        </Button>
      </CardFooter>
    </Card>
  );
};

export default NewEmptyProjectCard;
