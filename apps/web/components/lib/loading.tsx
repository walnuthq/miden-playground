import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyContent,
} from "@workspace/ui/components/empty";
import { Badge } from "@workspace/ui/components/badge";
import { Spinner } from "@workspace/ui/components/spinner";
import Logo from "@/components/lib/logo";
import useNetwork from "@/hooks/use-network";
import { networks } from "@/lib/types/network";

const Loading = () => {
  const { networkId } = useNetwork();
  const variants = {
    mtst: "default",
    mdev: "secondary",
    mlcl: "destructive",
    mmck: "default",
  } as const;
  return (
    <Empty className="h-screen">
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
        <Badge variant={variants[networkId]} className="rounded-xs h-8">
          Syncing {networks[networkId]} <Spinner />
        </Badge>
      </EmptyContent>
    </Empty>
  );
};

export default Loading;
