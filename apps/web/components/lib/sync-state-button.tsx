import { RotateCw } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import useGlobalContext from "@/components/global-context/hook";

const SyncStateButton = () => {
  const { syncState } = useGlobalContext();
  return (
    <Button
      variant="outline"
      size="icon"
      className="size-9"
      onClick={syncState}
    >
      <RotateCw />
    </Button>
  );
};

export default SyncStateButton;
