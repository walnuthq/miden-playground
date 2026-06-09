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
import { Button } from "@workspace/ui/components/button";
import useTutorials from "@/hooks/use-tutorials";

const NextTutorialButton = () => {
  const { tutorial, nextTutorial } = useTutorials();
  if (!tutorial) {
    return null;
  }
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button className="grow-2 bg-[#ff5500]">Next tutorial</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Build with Miden Takeoff</AlertDialogTitle>
          <AlertDialogDescription>
            Continue building on Miden using our dedicated AI assistant,
            prototype your Smart Contracts and dApp using agentic coding
            directly in your browser.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <a
            href="https://miden-takeoff.walnut.dev"
            target="_blank"
            rel="noreferrer"
          >
            <AlertDialogCancel className="cursor-pointer">
              Launch Miden Takeoff
            </AlertDialogCancel>
          </a>
          <AlertDialogAction onClick={nextTutorial}>
            Next tutorial
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default NextTutorialButton;
