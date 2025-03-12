'use client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import instructionsData from '../lib/instructions/instructions.json';
import { ScrollArea } from '@/components/ui/scroll-area';
import React from 'react';

export const InstructionsTab = () => {
	const renderStackItems = (stackString: string) => {
		const items = [];
		if (stackString && stackString !== '[]') {
			const itemsString = stackString.slice(1, -1);
			if (itemsString.trim()) {
				items.push(...itemsString.split(',').map((item) => item.trim()));
			}
		}

		return (
			<div className="flex flex-wrap gap-2">
				{items.map((item, idx) => (
					<span
						key={idx}
						className="text-theme-text-subtle bg-theme-surface-highlight px-2 py-1 rounded text-sm"
					>
						{item}
					</span>
				))}
				<span className="bg-theme-surface-highlight px-2 py-1 rounded text-sm">...</span>
			</div>
		);
	};

	return (
		<ScrollArea className="w-full h-full">
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
					{instructionsData.map((instructionItem) => (
						<React.Fragment key={instructionItem.class}>
							<TableRow>
								<TableCell className="pr-8 last:p-2 text-base font-bold">
									{instructionItem.class}
								</TableCell>
								<TableCell colSpan={3}></TableCell>
							</TableRow>
							{instructionItem.instructions.map((instruction, index) => (
								<TableRow key={index}>
									<TableCell className="pr-8 last:p-2">{instruction.instruction}</TableCell>
									<TableCell className="pr-8 last:p-2">
										{renderStackItems(instruction.stackInput)}
									</TableCell>
									<TableCell className="pr-8 last:p-2">
										{renderStackItems(instruction.stackOutput)}
									</TableCell>
									<TableCell className="pr-8 last:p-2">{instruction.notes}</TableCell>
								</TableRow>
							))}
						</React.Fragment>
					))}
				</TableBody>
			</Table>
		</ScrollArea>
	);
};
