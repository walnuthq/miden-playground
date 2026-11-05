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
import type { ExampleMeta } from "@/lib/types/example";

// An example's card, from its metadata (lib/examples/meta.tsx). Its button is
// disabled without `onLaunch`: the app shell renders it that way, before the
// SDK loads, so this module stays SDK-free.
export const LaunchExampleCardView = ({
  example,
  loading = false,
  onLaunch,
}: {
  example: ExampleMeta;
  loading?: boolean;
  onLaunch?: () => void;
}) => (
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
        disabled={loading || !onLaunch}
        onClick={onLaunch}
      >
        {loading && <Spinner />}
        {loading ? "Launching…" : "Launch example"}
      </Button>
    </CardFooter>
  </Card>
);
