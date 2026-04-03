import { useState, useEffect } from "react";
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
import useAccounts from "@/hooks/use-accounts";
import type { Example } from "@/lib/types/example";
import useExamples from "@/hooks/use-examples";

let callingLoadExample = false;

const LaunchExampleCard = ({ example }: { example: Example }) => {
  const { accounts } = useAccounts();
  const { exampleId, launchExample, loadExample } = useExamples();
  const [loading, setLoading] = useState(false);
  const exampleAccount = accounts.find(({ components }) =>
    components.includes(example.id),
  );
  useEffect(() => {
    const callLoadExample = async () => {
      callingLoadExample = true;
      await loadExample(example);
      callingLoadExample = false;
    };
    if (exampleId === example.id && !exampleAccount && !callingLoadExample) {
      callLoadExample();
    }
  }, [exampleId, example, exampleAccount, loadExample]);
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
            launchExample(example);
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
