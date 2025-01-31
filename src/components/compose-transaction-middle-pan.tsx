import React, { useCallback, useEffect, useState } from 'react';
import { Editor as MonacoEditor, Monaco, useMonaco } from '@monaco-editor/react';
import { Console } from './console';
import { cn } from '@/lib/utils';
import { editor } from 'monaco-editor';
import { useSelectedAccountData, useSelectedNoteData } from '@/lib/files';
import { useMiden } from '@/lib/context-providers';
import { TRANSACTION_SCRIPT_FILE_ID } from '@/lib/consts';
import { ScrollArea, ScrollBar } from './ui/scroll-area';
import { Vault } from './vault';
import OverviewLayout from './overview-details';
import { Textarea } from './ui/textarea';

const ComposeTransactionMiddlePan = () => {
	const { id: selectedAccountId, metadata, vault, name } = useSelectedAccountData();
	const {
		id: selectedNoteId,
		noteName,
		noteMetadata,
		noteVault,
		script,
		input
	} = useSelectedNoteData();
	const { updateFileContent, selectedOverview, files } = useMiden();
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
				<div className="flex-1 overflow-hidden text-theme-text">
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
				<div className="flex-1 overflow-hidden text-theme-text">
					<ScrollArea className="h-full w-full pb-2">
						{selectedOverview === 'account'
							? vaultData && (
									<OverviewLayout
										data={{
											'Account name': { value: name, copyable: true },
											'Account ID': { value: metadata, copyable: true, divider: true },
											Vault: <Vault accountId={selectedAccountId} />
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
											Vault: <Vault noteId={selectedNoteId} />,
											Inputs: (
												<Textarea
													className="border-theme-border w-full min-h-20"
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
