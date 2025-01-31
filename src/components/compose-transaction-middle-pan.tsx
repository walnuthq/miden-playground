'use client';
import React, { useEffect, useState } from 'react';
import { Console } from './console';
import { cn } from '@/lib/utils';

import { useMiden } from '@/lib/context-providers';
import { TRANSACTION_SCRIPT_FILE_ID } from '@/lib/consts';
import { ScrollArea, ScrollBar } from './ui/scroll-area';
import { ColumnDef } from '@tanstack/react-table';
import { AssetsDatatable } from './assets-datatable';
import OverviewLayout from './overview-details';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger
} from './ui/dropdown-menu';
import { Button } from './ui/button';
import { MoreHorizontal } from 'lucide-react';
import { Textarea } from './ui/textarea';
import { CustomMonacoEditor } from './custom-monaco-editor';
import { useSelectedAccountData, useSelectedNoteData } from './overview-data';

export type VaultType = {
	asset_type: string;
	id: string;
	symbol: string;
	amount: string;
};
export const columns: ColumnDef<VaultType>[] = [
	{
		accessorKey: 'asset_type',
		header: 'Asset type'
	},
	{
		accessorKey: 'id',
		header: 'Faucet ID'
	},
	{
		accessorKey: 'symbol',
		header: 'Symbol'
	},
	{
		accessorKey: 'amount',
		header: 'Amount'
	},
	{
		id: 'actions',
		enableHiding: false,
		cell: ({ row }) => {
			const faucet = row.original;

			return (
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button className="h-8 w-8 p-0 hover:bg-theme-border">
							<span className="sr-only">Open menu</span>
							<MoreHorizontal />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuLabel>Actions</DropdownMenuLabel>
						<DropdownMenuItem onClick={() => navigator.clipboard.writeText(faucet.id)}>
							Copy faucet ID
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			);
		}
	}
];
const ComposeTransactionMiddlePan = () => {
	const selectedAccountData = useSelectedAccountData();
	const selectedNoteData = useSelectedNoteData();
	const { updateFileContent, selectedOverviewTab, files } = useMiden();
	const [transactionScriptValue, setTransactionScriptValue] = useState(
		files[TRANSACTION_SCRIPT_FILE_ID].content.value
	);
	const [noteScriptValue, setNoteScriptValue] = useState(selectedNoteData?.script);
	const [vaultData, setVaultData] = useState();
	const [noteVaultData, setNoteVaultData] = useState();
	useEffect(() => {
		if (selectedAccountData?.vault) {
			const vaultArray = JSON.parse(selectedAccountData?.vault);
			setVaultData(
				vaultArray.map((item: number[]) => {
					return {
						asset_type: item[1],
						id: item[3],
						symbol: item[2],
						amount: item[0]
					};
				})
			);
		}
		if (selectedNoteData?.noteVault) {
			const noteVaultArray = JSON.parse(selectedNoteData?.noteVault);

			setNoteVaultData(
				noteVaultArray.map((item: number[]) => {
					return {
						asset_type: item[1],
						id: item[3],
						symbol: item[2],
						amount: item[0]
					};
				})
			);
		}
	}, [selectedAccountData?.vault, selectedNoteData?.noteVault]);

	useEffect(() => {
		setTransactionScriptValue(files[TRANSACTION_SCRIPT_FILE_ID].content.value);
	}, [files]);

	useEffect(() => {
		setNoteScriptValue(selectedNoteData?.script);
	}, [selectedNoteData?.script]);

	return (
		<div className="flex flex-col justify-end h-full">
			{selectedOverviewTab === 'transaction-script' ? (
				<div className="flex-1 overflow-hidden text-theme-text">
					<CustomMonacoEditor
						onChange={(value) => {
							setTransactionScriptValue(value ?? '');
							if (
								files[TRANSACTION_SCRIPT_FILE_ID].content.value &&
								!files[TRANSACTION_SCRIPT_FILE_ID].readonly
							)
								updateFileContent(TRANSACTION_SCRIPT_FILE_ID, value ?? '');
						}}
						value={transactionScriptValue}
						className={cn(
							'whitespace-pre-wrap overflow-hidden p-0 m-0 w-full h-full absolute top-0 left-0'
						)}
					/>
				</div>
			) : selectedOverviewTab !== '' ? (
				<div className="flex-1 overflow-hidden text-theme-text">
					<ScrollArea className="h-full w-full pb-2">
						{selectedOverviewTab === 'account'
							? vaultData && (
									<OverviewLayout
										data={{
											'Account name': { value: selectedAccountData?.name, copyable: true },
											'Account ID': {
												value: selectedAccountData?.metadata,
												copyable: true,
												divider: true
											},
											Vault: <AssetsDatatable data={vaultData} columns={columns} />
										}}
									/>
							  )
							: noteVaultData && (
									<OverviewLayout
										data={{
											'Note name': { value: selectedNoteData?.noteName, copyable: true },
											'Sender address': {
												value: selectedNoteData?.noteMetadata?.senderId,
												copyable: true
											},
											'Serial number': {
												value: selectedNoteData?.noteMetadata?.serialNumber,
												copyable: true,
												divider: true
											},
											Vault: <AssetsDatatable data={noteVaultData} columns={columns} />,

											Inputs: (
												<Textarea
													className="border-theme-border w-full min-h-20"
													defaultValue={selectedNoteData?.input}
												/>
											),
											Script: (
												<CustomMonacoEditor
													onChange={(value) => {
														setNoteScriptValue(value ?? '');
														// if (file && !file.readonly) updateFileContent(file.id, value ?? '');
													}}
													value={noteScriptValue}
													className={cn(
														'whitespace-pre-wrap overflow-hidden rounded-theme p-0 m-0 w-full h-[300px] absolute top-0 left-0'
													)}
												/>
											)
										}}
									/>
							  )}

						<ScrollBar orientation="horizontal" />
					</ScrollArea>
				</div>
			) : (
				<div className="flex-1 p-9 text-xl text-gray-400">
					<div className="">First, select account on left</div>
					<div className="mt-16">Then add notes</div>
					<div className="mt-64">Link to docs</div>
				</div>
			)}
			<Console />
		</div>
	);
};

export default ComposeTransactionMiddlePan;
