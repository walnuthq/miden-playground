'use client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import instructionsData from '../lib/instructions/instructions.json';
import { ScrollArea } from '@/components/ui/scroll-area';

export const InstructionsTab = () => {
	const { class: className, instructions } = instructionsData;

	return (
		<ScrollArea className={'w-full h-full'}>
			<Table className="[&_tr:hover]:bg-transparent overflow-y-scroll relative">
				<TableHeader className="bg-theme-surface-highlight sticky top-0 w-full">
					<TableRow>
						<TableHead className="pr-4 font-bold">Instruction</TableHead>
						<TableHead className="pr-4 font-bold">Stack Input</TableHead>
						<TableHead className="pr-4 font-bold">Stack Output</TableHead>
						<TableHead className="pr-4 font-bold">Notes</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					<TableRow>
						<TableCell className="pr-8 last:p-2 text-base font-bold">{className}</TableCell>
						<TableCell colSpan={3}></TableCell>
					</TableRow>
					{instructions.map((instruction, index) => (
						<TableRow key={index}>
							<TableCell className="pr-8 last:p-2">{instruction.instruction}</TableCell>
							<TableCell className="pr-8 last:p-2">{instruction.stackInput}</TableCell>
							<TableCell className="pr-8 last:p-2">{instruction.stackOutput}</TableCell>
							<TableCell className="pr-8 last:p-2">{instruction.notes}</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</ScrollArea>
	);
};
