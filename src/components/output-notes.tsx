import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { useMiden } from '@/lib/context-providers';

const OutputNotes = () => {
	const { accountUpdates, notes } = useMiden();

	return accountUpdates && accountUpdates.outputNotes.length > 0 ? (
		<div className="rounded-theme border border-theme-border w-fit">
			<Table className="[&_tr:hover]:bg-transparent">
				<TableHeader>
					<TableRow>
						<TableHead className="pr-4">Name</TableHead>
						<TableHead className="pr-4">Serial Number</TableHead>
						<TableHead className="pr-4">Sender</TableHead>
						<TableHead className="pr-4">Tag</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{accountUpdates?.outputNotes.map((outputNote) => {
						const note = Object.values(notes).find((n) => n.initialNoteId === outputNote.id);
						return (
							<TableRow key={outputNote.id}>
								<TableCell className="pr-8 last:p-2">{note?.name}</TableCell>
								<TableCell className="pr-8 last:p-2">{note?.serialNumberDecimalString}</TableCell>
								<TableCell className="pr-8 last:p-2">{note?.senderId}</TableCell>
								<TableCell className="pr-8 last:p-2">{outputNote.tag}</TableCell>
							</TableRow>
						);
					})}
				</TableBody>
			</Table>
		</div>
	) : (
		<div className="text-theme-text-subtle">No output notes</div>
	);
};

export default OutputNotes;
