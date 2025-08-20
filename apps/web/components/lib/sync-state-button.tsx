import { useState } from "react";
import { RotateCw, Loader2Icon } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import useGlobalContext from "@/components/global-context/hook";

const SyncStateButton = () => {
  const { syncState } = useGlobalContext();
  const [loading, setLoading] = useState(false);
  return (
    <Button
      variant="outline"
      size="icon"
      className="size-9"
      onClick={async () => {
        setLoading(true);
        await syncState();
        setLoading(false);
      }}
    >
      {loading ? <Loader2Icon className="animate-spin" /> : <RotateCw />}
    </Button>
  );
};

export default SyncStateButton;
