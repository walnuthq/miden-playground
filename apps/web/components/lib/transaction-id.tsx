import { Button } from "@workspace/ui/components/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import { Link } from "react-router";
import { formatId } from "@/lib/utils";

const TransactionId = ({ transactionId }: { transactionId: string }) => (
  <Tooltip>
    <TooltipTrigger render={<Link to={`/transactions/${transactionId}`} />}>
      <Button className="cursor-pointer -ml-4" variant="link">
        {formatId(transactionId)}
      </Button>
    </TooltipTrigger>
    <TooltipContent>
      <p>{transactionId}</p>
    </TooltipContent>
  </Tooltip>
);

export default TransactionId;
