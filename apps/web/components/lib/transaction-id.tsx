import Link from "next/link";
import { Button } from "@workspace/ui/components/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import { formatId } from "@/lib/utils";

const TransactionId = ({ transactionId }: { transactionId: string }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Link href={`/transactions/${transactionId}`}>
        <Button className="cursor-pointer -ml-4" variant="link">
          {formatId(transactionId)}
        </Button>
      </Link>
    </TooltipTrigger>
    <TooltipContent>
      <p>{transactionId}</p>
    </TooltipContent>
  </Tooltip>
);

export default TransactionId;
