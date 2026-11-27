import { cn } from "@workspace/ui/lib/utils";

// A storage slot's name (`counter_account::count_map`, as the MASM source
// names it), shown as code wherever the app displays one. Names have no place to
// break, so they break anywhere rather than widen their container. `title`
// gives the full name when `children` shows part of it.
const StorageSlotName = ({
  name,
  children,
  className,
}: {
  name: string;
  children?: string;
  className?: string;
}) => (
  <code
    className={cn("font-mono text-xs break-all", className)}
    title={children === undefined ? undefined : name}
  >
    {children ?? name}
  </code>
);

export default StorageSlotName;
