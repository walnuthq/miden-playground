import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import { Spinner } from "@workspace/ui/components/spinner";
import type { Example } from "@/lib/types/example";
import useExamples from "@/hooks/use-examples";

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
          className="w-full bg-[#f9f9f9]"
          disabled={loading}
          onClick={() => {
            setLoading(true);
            launchExample(example.id);
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
