import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Spinner } from "@workspace/ui/components/spinner";
import { useState } from "react";
import { toast } from "sonner";
import useExamples from "@/hooks/use-examples";
import type { Example } from "@/lib/types/example";

const LaunchExampleCard = ({ example }: { example: Example }) => {
  const { launchExample } = useExamples();
  const [loading, setLoading] = useState(false);
  return (
    <Card>
      <CardHeader className="gap-0">
        <CardTitle className="text-xl">{example.title}</CardTitle>
        <CardDescription>{example.tagline}</CardDescription>
      </CardHeader>
      <CardContent className="h-full">{example.description}</CardContent>
      <CardFooter>
        <Button
          variant="outline"
          className="w-full bg-muted/50"
          disabled={loading}
          onClick={async () => {
            setLoading(true);
            const { error } = await launchExample(example.id);
            if (error !== undefined) {
              toast.error("Example couldn't be launched.", {
                description: error,
              });
              setLoading(false);
            }
          }}
        >
          {loading && <Spinner />}
          {loading ? "Launching…" : "Launch example"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default LaunchExampleCard;
