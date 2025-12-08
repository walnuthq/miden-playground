import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { MoreVertical } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import {
  defaultDependencies,
  scriptTypes,
  type Script,
} from "@/lib/types/script";
import useScripts from "@/hooks/use-scripts";
import { formatDigest } from "@/lib/utils";

const DependencyActionsCell = ({
  script,
  dependencyId,
}: {
  script: Script;
  dependencyId: string;
}) => {
  const { updateScript } = useScripts();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="size-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => {
            const index = script.dependencies.findIndex(
              ({ id }) => id === dependencyId
            );
            updateScript({
              ...script,
              dependencies: [
                ...script.dependencies.slice(0, index),
                ...script.dependencies.slice(index + 1),
              ],
            });
          }}
        >
          Remove dependency
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const DependenciesTable = ({ script }: { script: Script }) => {
  const { scripts } = useScripts();
  const dependencies = script.dependencies
    .map((dependency) => {
      const scriptDependency = scripts.find(
        ({ name }) => name === dependency.name
      );
      return scriptDependency
        ? {
            id: scriptDependency.id,
            name: scriptDependency.name,
            type: scriptDependency.type,
            digest: dependency.digest,
          }
        : undefined;
    })
    .filter((dependency) => !["std", "base"].includes(dependency?.id ?? ""))
    .filter((dependency) => dependency !== undefined);
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Digest</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {dependencies.map(({ id, name, type, digest }) => (
            <TableRow key={id}>
              <TableCell>
                <Link
                  href={`/scripts/${id}`}
                  className="text-primary font-medium underline underline-offset-4"
                >
                  {name}
                </Link>
              </TableCell>
              <TableCell>{scriptTypes[type]}</TableCell>
              <TableHead>{digest && formatDigest(digest)}</TableHead>
              <TableCell>
                <DependencyActionsCell script={script} dependencyId={id} />
              </TableCell>
            </TableRow>
          ))}
          {defaultDependencies().map(({ id, name, digest }) => (
            <TableRow key={id}>
              <TableCell>{name}</TableCell>
              <TableCell>Default Package</TableCell>
              <TableCell>{digest && formatDigest(digest)}</TableCell>
              <TableCell />
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default DependenciesTable;
