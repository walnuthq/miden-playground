import Link from "next/link";
import { type Component, componentTypes } from "@/lib/types/component";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@workspace/ui/components/table";
import useScripts from "@/hooks/use-scripts";

const ComponentInformationTable = ({ component }: { component: Component }) => {
  const { scripts } = useScripts();
  const script = scripts.find(({ id }) => id === component.scriptId);
  return (
    <div className="rounded-md border">
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>{component.id}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>{component.name}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Type</TableCell>
            <TableCell>{componentTypes[component.type]}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Script</TableCell>
            <TableCell>
              <Link
                className="text-primary font-medium underline underline-offset-4"
                href={`/scripts/${script?.id}`}
              >
                {script?.name}
              </Link>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
};

export default ComponentInformationTable;
