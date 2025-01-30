'use client';

import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';

import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from '@/components/ui/table';
import { useMiden } from '@/lib/context-providers';
import { cn } from '@/lib/utils';

export function Vault({
	noteId,
	accountId,
	className
}: {
	noteId?: string;
	accountId?: string;
	className?: string;
}) {
	const { notes, accounts } = useMiden();

	const note = noteId ? notes[noteId] : null;
	const account = accountId ? accounts[accountId] : null;
	const assets = note?.assets || account?.assets || [];

	const columns = [
		{
			accessorKey: 'faucetId',
			header: 'Faucet ID'
		},
		{
			accessorKey: 'amount',
			header: 'Amount'
		}
	];

	const table = useReactTable({
		data: assets,
		columns,
		getCoreRowModel: getCoreRowModel()
	});

	if (!noteId && !accountId) return null;

	return (
		<div className={cn('rounded-theme border border-theme-border w-fit', className)}>
			<Table className="[&_tr:hover]:bg-transparent">
				<TableHeader>
					{table.getHeaderGroups().map((headerGroup) => (
						<TableRow key={headerGroup.id}>
							{headerGroup.headers.map((header) => {
								return (
									<TableHead key={header.id}>
										{header.isPlaceholder
											? null
											: flexRender(header.column.columnDef.header, header.getContext())}
									</TableHead>
								);
							})}
						</TableRow>
					))}
				</TableHeader>
				<TableBody>
					{table.getRowModel().rows?.length ? (
						table.getRowModel().rows.map((row) => (
							<TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
								{row.getVisibleCells().map((cell) => (
									<TableCell key={cell.id} className="pr-8 last:p-2">
										{flexRender(cell.column.columnDef.cell, cell.getContext())}
									</TableCell>
								))}
							</TableRow>
						))
					) : (
						<TableRow>
							<TableCell colSpan={columns.length} className="h-24 text-center">
								No results.
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>
		</div>
	);
}
