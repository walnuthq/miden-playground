import { Badge } from "@workspace/ui/components/badge";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty";
import { Spinner } from "@workspace/ui/components/spinner";
import Logo from "@/components/lib/logo";
import useNetwork from "@/hooks/use-network";
import { networks } from "@/lib/types/network";

// The app shell's page while the Miden client initializes, on every page but
// the home page (which the shell shows, actions disabled).
const Loading = () => {
  const { networkId } = useNetwork();
  const variants = {
    mm: "default",
    mtst: "outline",
    mdev: "secondary",
    mlcl: "destructive",
    mmck: "default",
  } as const;
  return (
    <Empty className="flex-1">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Logo className="size-8" />
        </EmptyMedia>
        <EmptyTitle>Loading Miden Playground…</EmptyTitle>
        <EmptyDescription className="max-w-xs text-pretty">
          This may take a few seconds. If it takes too long, try refreshing the
          page.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Badge variant={variants[networkId]} className="h-8">
          Syncing {networks[networkId]} <Spinner />
        </Badge>
      </EmptyContent>
    </Empty>
  );
};

export default Loading;
