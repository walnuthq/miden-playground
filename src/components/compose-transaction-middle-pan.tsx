import React, { useCallback, useEffect, useState } from 'react';
import { Editor as MonacoEditor, Monaco, useMonaco } from '@monaco-editor/react';
import { Console } from './console';
import { cn } from '@/lib/utils';
import { editor } from 'monaco-editor';
import { useSelectedAccountData, useSelectedNoteData } from '@/lib/files';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

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
						<Button className="h-8 w-8 p-0 hover:bg-dark-miden-700">
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
	const { metadata, vault, name, script: accountScript } = useSelectedAccountData();
	const { noteName, noteMetadata, noteVault, script, input } = useSelectedNoteData();
	const {
		updateFileContent,
		selectedOverview,
		files,
		accounts,
		notes,
		selectTransactionNote,
		selectedTransactionNotesIds
	} = useMiden();
	const [transactionScriptValue, setTransactionScriptValue] = useState(
		files[TRANSACTION_SCRIPT_FILE_ID].content.value
	);
	const [noteScriptValue, setNoteScriptValue] = useState(script);
	const [vaultData, setVaultData] = useState();
	const [noteVaultData, setNoteVaultData] = useState();
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
		if (noteVault) {
			const noteVaultArray = JSON.parse(noteVault);

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
	}, [vault, noteVault]);

	useEffect(() => {
		setTransactionScriptValue(files[TRANSACTION_SCRIPT_FILE_ID].content.value);
	}, [files]);

	useEffect(() => {
		setNoteScriptValue(script);
	}, [script]);

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
			{selectedOverview === 'transaction-script' ? (
				<div className="flex-1 overflow-hidden text-white">
					<MonacoEditor
						onChange={(value) => {
							setTransactionScriptValue(value ?? '');
							if (
								files[TRANSACTION_SCRIPT_FILE_ID].content.value &&
								!files[TRANSACTION_SCRIPT_FILE_ID].readonly
							)
								updateFileContent(TRANSACTION_SCRIPT_FILE_ID, value ?? '');
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
						value={transactionScriptValue}
						className={cn(
							'whitespace-pre-wrap overflow-hidden p-0 m-0 w-full h-full absolute top-0 left-0'
						)}
					/>
				</div>
			) : selectedOverview !== '' ? (
				<div className="flex-1 overflow-hidden text-white">
					<ScrollArea className="h-full w-full pb-2">
						{selectedOverview === 'account'
							? vaultData && (
									<OverviewLayout
										data={{
											'Account name': { value: name, copyable: true },
											'Account ID': { value: metadata, copyable: true, divider: true },
											Vault: <AssetsDatatable data={vaultData} columns={columns} />
										}}
									/>
							  )
							: noteVaultData && (
									<OverviewLayout
										data={{
											'Note name': { value: noteName, copyable: true },
											'Sender address': { value: noteMetadata?.senderId, copyable: true },
											'Serial number': {
												value: noteMetadata?.serialNumber,
												copyable: true,
												divider: true
											},
											Vault: <AssetsDatatable data={noteVaultData} columns={columns} />,

											Inputs: (
												<Textarea
													className="border-dark-miden-700 w-full min-h-20"
													defaultValue={input}
												/>
											),
											Script: (
												<MonacoEditor
													onChange={(value) => {
														setNoteScriptValue(value ?? '');
														// if (file && !file.readonly) updateFileContent(file.id, value ?? '');
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
													value={noteScriptValue}
													className={cn(
														'whitespace-pre-wrap overflow-hidden rounded-miden p-0 m-0 w-full h-[300px] absolute top-0 left-0'
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
				// <div className="flex-1 p-9 text-xl text-gray-400">
				// 	<div className="">First, select account on left</div>
				// 	<div className="mt-16">Then add notes</div>
				// 	<div className="mt-64">Link to docs</div>
				// </div>

				<div className="flex flex-row h-full p-6 gap-6">
					<div className="flex-1 flex flex-col">
						<div className="text-gray-400 px-2 pb-1">
							<DropdownMenu>
								<DropdownMenuTrigger>
									<div className="font-mono flex flex-row items-center gap-1">
										<span>Account</span>{' '}
										<svg
											xmlns="http://www.w3.org/2000/svg"
											height="24px"
											viewBox="0 -960 960 960"
											width="24px"
											fill="currentColor"
											className="size-6"
										>
											<path d="M459-381 314-526q-3-3-4.5-6.5T308-540q0-8 5.5-14t14.5-6h304q9 0 14.5 6t5.5 14q0 2-6 14L501-381q-5 5-10 7t-11 2q-6 0-11-2t-10-7Z" />
										</svg>
									</div>
								</DropdownMenuTrigger>
								<DropdownMenuContent>
									{Object.values(accounts).map((account) => (
										<DropdownMenuItem key={account.id} onClick={() => {}}>
											{account.name}
										</DropdownMenuItem>
									))}
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
						<div className="flex-1 border-2 border-dark-miden-700 rounded-miden flex flex-col p-5">
							<Tabs defaultValue="account" className="h-full flex flex-col">
								<div>
									<TabsList className="">
										<TabsTrigger value="account">Overview</TabsTrigger>
										<TabsTrigger value="password">Script</TabsTrigger>
									</TabsList>
								</div>
								<TabsContent value="account" className="pt-4">
									<OverviewLayout
										data={{
											'Account name': { value: name, copyable: true },
											'Account ID': { value: metadata, copyable: true },
											Nonce: { value: 1, copyable: true, divider: true },
											Vault: <AssetsDatatable data={vaultData ?? []} columns={columns} />,
											Storage: { value: '' }
										}}
									/>
								</TabsContent>
								<TabsContent value="password" className="flex-1">
									<div className="h-full w-full relative">
										<MonacoEditor
											onChange={(value) => {
												// setNoteScriptValue(value ?? '');
												// if (file && !file.readonly) updateFileContent(file.id, value ?? '');
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
											value={accountScript}
											className={cn(
												'whitespace-pre-wrap overflow-hidden rounded-theme p-0 m-0 w-full absolute inset-0'
											)}
										/>
									</div>
								</TabsContent>
							</Tabs>
						</div>
					</div>

					<div className="flex-1 flex flex-col justify-start gap-6">
						<div className="flex flex-col flex-1">
							<div className="text-gray-400 px-2 pb-1">
								<div className="font-mono flex flex-row items-center gap-1">
									<span>Notes</span>{' '}
								</div>
							</div>

							<div className="flex flex-col flex-1 gap-6">
								{selectedTransactionNotesIds.map((noteId) => (
									<div
										key={noteId}
										className="p-5 basis-1/4 border-2 border-dark-miden-700 cursor-pointer rounded-miden h-full relative"
									>
										<OverviewLayout
											data={{
												'Note name': {
													value: notes[selectedTransactionNotesIds[0]].name,
													copyable: true
												},
												'Serial number': {
													value:
														notes[selectedTransactionNotesIds[0]].serialNumber
															.toString()
															.substring(0, 15) + '...',
													copyable: true
												},
												'Sender id': {
													value: notes[selectedTransactionNotesIds[0]].senderId,
													copyable: true
												}
											}}
										/>
										<div className="absolute bottom-5 right-5">
											<Button variant="secondary">Expand</Button>
										</div>
									</div>
								))}

								{selectedTransactionNotesIds.length < 4 && (
									<div className="basis-1/4 border-2 border-dashed border-dark-miden-700 hover:border-theme-text-subtle hover:text-theme-text cursor-pointer rounded-miden h-full flex flex-col justify-center items-center text-white text-opacity-40 font-semibold text-lg">
										<DropdownMenu>
											<DropdownMenuTrigger>
												<span>Select note</span>
											</DropdownMenuTrigger>
											<DropdownMenuContent>
												{Object.values(notes).map((note) => (
													<DropdownMenuItem
														key={note.id}
														onClick={() => {
															selectTransactionNote(note.id);
														}}
													>
														{note.name}
													</DropdownMenuItem>
												))}
											</DropdownMenuContent>
										</DropdownMenu>
									</div>
								)}
							</div>

							{false && (
								<div className="border-2 border-dark-miden-700 rounded-miden h-full p-6">
									<Tabs defaultValue="account" className="h-full flex flex-col">
										<div>
											<TabsList className="">
												<TabsTrigger value="account">Overview</TabsTrigger>
												<TabsTrigger value="password">Script</TabsTrigger>
											</TabsList>
										</div>
										<TabsContent value="account" className="pt-4">
											<OverviewLayout
												data={{
													'Note name': {
														value: notes[selectedTransactionNotesIds[0]].name,
														copyable: true
													},
													'Sender id': {
														value: notes[selectedTransactionNotesIds[0]].senderId,
														copyable: true
													},
													'Serial number': {
														value:
															notes[selectedTransactionNotesIds[0]].serialNumber
																.toString()
																.substring(0, 20) + '...',
														copyable: true,
														divider: true
													},
													Vault: (
														<AssetsDatatable
															data={notes[selectedTransactionNotesIds[0]].assets.map((asset) => ({
																asset_type: '0',
																id: asset.faucetId.toString(),
																symbol: '0',
																amount: asset.amount.toString()
															}))}
															columns={columns}
														/>
													),

													Inputs: (
														<Textarea
															className="border-dark-miden-700 w-full min-h-20"
															defaultValue={
																files[notes[selectedTransactionNotesIds[0]].inputFileId].content
																	.value
															}
														/>
													)
												}}
											/>
										</TabsContent>
										<TabsContent value="password" className="flex-1">
											<div className="h-full w-full relative">
												<MonacoEditor
													onChange={(value) => {
														// setNoteScriptValue(value ?? '');
														// if (file && !file.readonly) updateFileContent(file.id, value ?? '');
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
													value={
														files[notes[selectedTransactionNotesIds[0]].scriptFileId].content.value
													}
													className={cn(
														'whitespace-pre-wrap overflow-hidden rounded-theme p-0 m-0 w-full absolute inset-0'
													)}
												/>
											</div>
										</TabsContent>
									</Tabs>
								</div>
							)}
						</div>
						{/* <div className="flex flex-col basis-1/3">
							<div className="text-gray-400 px-2 pb-1 font-mono">Transaction script</div>
							<div className="border-2 border-dark-miden-700 rounded-miden h-full">
								<MonacoEditor
									onChange={(value) => {
										setTransactionScriptValue(value ?? '');
										if (
											files[TRANSACTION_SCRIPT_FILE_ID].content.value &&
											!files[TRANSACTION_SCRIPT_FILE_ID].readonly
										)
											updateFileContent(TRANSACTION_SCRIPT_FILE_ID, value ?? '');
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
									value={transactionScriptValue}
									className={cn(
										'whitespace-pre-wrap overflow-hidden p-0 m-0 w-full h-full absolute top-0 left-0'
									)}
								/>
							</div>
						</div> */}
					</div>
				</div>
			)}
			<div className="h-[280px] flex flex-row w-full gap-6">
				<div className="flex-1 flex flex-col">
					<div className="flex flex-col flex-1 mb-6 ml-6">
						<div className="text-gray-400 px-2 pb-1">
							<div className="font-mono flex flex-row items-center gap-1">
								<span>Transaction script</span>
							</div>
						</div>
						<div className="flex-1 border-2 border-theme-border rounded-theme">
							<MonacoEditor
								onChange={(value) => {
									setTransactionScriptValue(value ?? '');
									if (
										files[TRANSACTION_SCRIPT_FILE_ID].content.value &&
										!files[TRANSACTION_SCRIPT_FILE_ID].readonly
									)
										updateFileContent(TRANSACTION_SCRIPT_FILE_ID, value ?? '');
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
								value={transactionScriptValue}
								className={cn(
									'whitespace-pre-wrap overflow-hidden p-0 m-0 w-full h-full absolute top-0 left-0'
								)}
							/>
						</div>
					</div>
				</div>
				<div className="flex-1 h-full border-t-2 border-l-2 border-theme-border rounded-tl-theme flex flex-col">
					<Console />
				</div>
			</div>
		</div>
	);
};

export default ComposeTransactionMiddlePan;
