import { useState } from "react";
import { toast } from "sonner";
import { LaunchExampleCardView } from "@/components/home/launch-example-card-view";
import useExamples from "@/hooks/use-examples";
import type { ExampleMeta } from "@/lib/types/example";

const LaunchExampleCard = ({ example }: { example: ExampleMeta }) => {
  const { launchExample } = useExamples();
  const [loading, setLoading] = useState(false);
  return (
    <LaunchExampleCardView
      example={example}
      loading={loading}
      onLaunch={async () => {
        setLoading(true);
        const { error, cancelled } = await launchExample(example.id);
        if (error !== undefined) {
          toast.error("Example couldn't be launched.", {
            description: error,
          });
        }
        if (error !== undefined || cancelled) {
          setLoading(false);
        }
      }}
    />
  );
};

export default LaunchExampleCard;
