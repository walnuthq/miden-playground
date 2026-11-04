import { Badge } from "@workspace/ui/components/badge";
import { type ScriptStatus, scriptStatuses } from "@/lib/types/script";

const variants = {
  draft: "secondary",
  compiled: "outline",
  error: "destructive",
} as const satisfies Record<ScriptStatus, string>;

// A script's compile status, the same in the scripts list and on its page.
const ScriptStatusBadge = ({ status }: { status: ScriptStatus }) => (
  <Badge variant={variants[status]}>{scriptStatuses[status]}</Badge>
);

export default ScriptStatusBadge;
