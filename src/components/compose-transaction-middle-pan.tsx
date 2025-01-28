import React, { useCallback, useEffect, useState } from 'react';
import { Editor as MonacoEditor, Monaco, useMonaco } from '@monaco-editor/react';
import { Console } from './console';
import { cn } from '@/lib/utils';
import { editor } from 'monaco-editor';
import { useSelectedAccountData, useSelectedEditorFile, useSelectedNoteData } from '@/lib/files';
import { useMiden } from '@/lib/context-providers';
import { TRANSACTION_SCRIPT_FILE_ID } from '@/lib/consts';
import { ScrollArea, ScrollBar } from './ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
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
						<Button variant="ghost" className="h-8 w-8 p-0">
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
	const { metadata, vault, name } = useSelectedAccountData();
	const { noteVault, script, input } = useSelectedNoteData();
	const { updateFileContent, selectedFileId, selectedOverview } = useMiden();
	const { content, file } = useSelectedEditorFile();
	const [value, setValue] = useState(content);
	const [vaultData, setVaultData] = useState();
	useEffect(() => {
		if (vault) {
			const vaultArray = JSON.parse(vault);

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
	}, [vault]);

	useEffect(() => {
		setValue(content);
	}, [content]);
	const configureMonaco = useCallback((_monaco: Monaco) => {
		if (_monaco) {
			_monaco.editor.defineTheme('miden', {
				base: 'vs-dark',
				inherit: true,
				rules: [],
				colors: {
					'editor.background': '#040113',
					'editor.foreground': '#4E8CC0',
					'editorLineNumber.foreground': '#4E8CC0',
					'editorLineNumber.activeForeground': '#83afd4'
				}
			});
			_monaco.editor.setTheme('miden');
		}
	}, []);

	const monaco = useMonaco();

	useEffect(() => {
		if (monaco) {
			configureMonaco(monaco);
		}
	}, [configureMonaco, monaco]);

	return (
		<div className="flex flex-col justify-end h-full">
			{selectedFileId === TRANSACTION_SCRIPT_FILE_ID &&
			selectedOverview === 'transaction-script' ? (
				<div className="flex-1 overflow-hidden text-white">
					<MonacoEditor
						onChange={(value) => {
							setValue(value ?? '');
							if (file && !file.readonly) updateFileContent(file.id, value ?? '');
						}}
						onMount={(editor: editor.IStandaloneCodeEditor, _monaco) => {
							configureMonaco(_monaco);
						}}
						options={{
							overviewRulerLanes: 0,
							minimap: { enabled: false },
							wordBreak: 'keepAll',
							wordWrap: 'on',
							smoothScrolling: true,
							scrollbar: {
								verticalSliderSize: 5,
								verticalScrollbarSize: 5
							},
							theme: 'miden',
							readOnly: false
						}}
						value={value}
						className={cn(
							'whitespace-pre-wrap overflow-hidden p-0 m-0 w-full h-full absolute top-0 left-0'
						)}
					/>
				</div>
			) : selectedOverview !== '' ? (
				<div className="flex-1 overflow-hidden text-white">
					<ScrollArea className="h-full w-full px-3 py-2">
						{selectedOverview === 'account' ? (
							vaultData && (
								<OverviewLayout
									data={{
										'Account name': name,
										'Account ID': metadata,
										Vault: <AssetsDatatable data={vaultData} columns={columns} />
									}}
								/>
							)
						) : (
							<Table className="[&_tr:hover]:bg-transparent">
								<TableHeader>
									<TableRow>
										<TableHead>{'Script'}</TableHead>
										<TableHead>Vault</TableHead>
										<TableHead>{'Input'}</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									<TableRow>
										<TableCell>
											<ScrollArea>
												<pre className="whitespace-pre-wrap max-h-[200px]">{script}</pre>
											</ScrollArea>
										</TableCell>
										<TableCell>
											<pre className="whitespace-pre-wrap overflow-auto max-h-[200px]">
												<pre className="whitespace-nowrap overflow-auto">{noteVault}</pre>
											</pre>
										</TableCell>
										<TableCell>
											{' '}
											<pre className="whitespace-pre-wrap overflow-auto max-h-[200px]">
												<pre className="whitespace-nowrap overflow-auto">{input} </pre>
											</pre>
										</TableCell>
									</TableRow>
								</TableBody>
							</Table>
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
