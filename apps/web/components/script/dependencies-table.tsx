import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { scriptTypes, type Script } from "@/lib/types/script";
import useScripts from "@/hooks/use-scripts";

const DependenciesTable = ({ script }: { script: Script }) => {
  const { scripts } = useScripts();
  const dependencies = script.dependencies
    .map((scriptId) => scripts.find(({ id }) => id === scriptId))
    .filter((dependency) => dependency !== undefined);
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Package Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {dependencies.map((dependency) => (
            <TableRow key={dependency.id}>
              <TableCell>{dependency.name}</TableCell>
              <TableCell>{dependency.packageName}</TableCell>
              <TableCell>{scriptTypes[dependency.type]}</TableCell>
              <TableCell>
                {/* <NoteActionsCell account={account} inputNote={inputNote} /> */}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default DependenciesTable;
