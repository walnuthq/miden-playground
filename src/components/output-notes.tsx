import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';

const OutputNotes = () => {
	return (
		<div className="rounded-theme border border-theme-border w-fit">
			<Table className="[&_tr:hover]:bg-transparent">
				<TableHeader>
					<TableRow>
						<TableHead className="pr-4">Name</TableHead>
						<TableHead className="pr-4">Serial number</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					<TableRow>
						<TableCell className="pr-8 last:p-2">Payback - 11111111</TableCell>
						<TableCell className="pr-8 last:p-2">122322432423423423423423</TableCell>
					</TableRow>
					<TableRow>
						<TableCell className="pr-8 last:p-2">Payback - 22222222</TableCell>
						<TableCell className="pr-8 last:p-2">122322432423423423423423</TableCell>
					</TableRow>
				</TableBody>
			</Table>
		</div>
	);
};

export default OutputNotes;
