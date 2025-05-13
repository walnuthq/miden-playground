import { useAccounts, useFiles, useNotes } from '@/lib/context-providers';
import AccountCodeFile from './account-code-file';
import { CustomMonacoEditor } from './custom-monaco-editor';
import { EditorFile } from '@/lib/files';
import { useEffect, useState } from 'react';
import { Vault } from './vault';
import { Storage } from './storage';
import { ScrollArea, ScrollBar } from './ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import json5 from 'json5';
import { useToast } from '@/hooks/use-toast';

const useSelectedEditorFile = (): { content: string; file: EditorFile | null } => {
	const { files, selectedFileId } = useFiles();
	const { accounts } = useAccounts();
	const { notes } = useNotes();
	if (!selectedFileId) return { content: '', file: null };
	const file = files[selectedFileId];
	let content = '';
	if (file) {
		if (file.content.dynamic) {
			if (file.content.dynamic.account) {
				if (file.content.dynamic.account.variant === 'metadata') {
					const account = accounts[file.content.dynamic.account.accountId];
					content = JSON.stringify(
						{
							accountId: account.id.id.toString(),
							prefix: account.id.prefix.toString(),
							suffix: account.id.suffix.toString()
						},
						null,
						2
					);
				}
			} else if (file.content.dynamic.note) {
				if (file.content.dynamic.note.variant === 'metadata') {
					const note = notes[file.content.dynamic.note.noteId];
					content = JSON.stringify(
						{
							senderId: note.senderId.toString(),
							serialNumber: note.serialNumberDecimalString
						},
						null,
						2
					);
				} else if (file.content.dynamic.note.variant === 'vault') {
					const note = notes[file.content.dynamic.note.noteId];
					content = JSON.stringify(
						note.assets.map((asset) => [asset.amount.toString(), 0, 0, asset.faucetId.toString()]),
						null,
						2
					);
				}
			}
		} else {
			content = file.content.value;
		}
	}
	return { content, file };
};

export const Files = () => {
	const { selectedFileId, updateFileContent, files } = useFiles();
	const { accounts } = useAccounts();
	const { notes, handleChangeInput, setNoteAux, setNoteTag } = useNotes();
	const { content, file } = useSelectedEditorFile();
	const [newInput, setNewInput] = useState('');
	const [value, setValue] = useState(content);
	const account =
		file && file.content.dynamic && file.content.dynamic.account
			? accounts[file.content.dynamic.account.accountId]
			: null;

	const note =
		file && file.content.dynamic && file.content.dynamic.note
			? notes[file?.content?.dynamic?.note?.noteId]
			: null;
	const { toast } = useToast();

	useEffect(() => {
		setValue(content);
	}, [content]);
	if (!selectedFileId || !file) return <div className="flex-1 bg-[#040113]"></div>;
	if (
		file.content &&
		'variant' in file.content &&
		file.content.variant === 'account-code' &&
		'accountId' in file.content &&
		typeof file.content.accountId === 'string'
	) {
		return (
			<ScrollArea className={`overflow-auto h-full flex-1 bg-[#040113]`}>
				<AccountCodeFile
					accountFile={file.content.value}
					fileId={file.id}
					accountId={file.content.accountId}
				/>
			</ScrollArea>
		);
	} else if (file?.content?.dynamic?.account?.variant === 'metadata') {
		return (
			<ScrollArea className="flex-1 bg-[#040113] overflow-auto h-full  account-code-step">
				<div className="p-4 text-theme-text text-sm">
					<div>INFO</div>
					<div className="w-fit mt-2 " id="account-info">
						<div className={'rounded-theme border border-theme-border overflow-hidden '}>
							<Table className="[&_tr:hover]:bg-transparent">
								<TableHeader>
									<TableRow>
										<TableHead className="pr-4">Name</TableHead>
										<TableHead className="pr-4">Account ID</TableHead>
										<TableHead className="pr-4">Nonce</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									<TableRow>
										<TableCell className="pr-8 last:p-2">{account?.name.toString()}</TableCell>
										<TableCell className="pr-8 last:p-2">
											{`(${account?.id.prefix.toString()},
											${account?.id.suffix.toString()})`}
										</TableCell>
										<TableCell className="pr-8 last:p-2 flex flex-row font-mono">
											<div className="min-w-8">{account?.nonce}</div>
										</TableCell>
									</TableRow>
								</TableBody>
							</Table>
						</div>
					</div>
					<div className="mt-6 mb-2">VAULT</div>
					<Vault accountId={file.content.dynamic.account.accountId} addAssetAbility />
					<div className="mt-6 mb-2">STORAGE</div>
					{account && <Storage className="h-72" accountId={account?.id.id} withoutOldValue />}
				</div>
			</ScrollArea>
		);
	} else if (file?.content?.dynamic?.note?.variant === 'metadata') {
		const handleAddInput = () => {
			if (newInput.trim() !== '') {
				handleChangeInput(note!.id, newInput, parsedInputs().length);
				setNewInput('');
			} else {
				toast({
					title: 'Please enter the new input',
					variant: 'destructive'
				});
			}
		};

		const parsedInputs = () => {
			try {
				if (!files[note!.inputFileId].content.value) {
					return [];
				}
				const parsed = json5.parse(files[note!.inputFileId].content.value!);
				return Array.isArray(parsed) ? parsed : [];
			} catch (error) {
				console.error(error);
				return [];
			}
		};

		return (
			<ScrollArea className="flex-1 bg-[#040113] overflow-auto h-full pr-4">
				<div className="p-4 text-theme-text text-sm">
					<div>INPUTS</div>
					<div className="w-fit mt-2 ">
						<div
							className={'rounded-theme border border-theme-border overflow-hidden n'}
							id="note-inputs"
						>
							<Table className="[&_tr:hover]:bg-transparent">
								<TableBody>
									{parsedInputs().map((input, index) => (
										<TableRow key={`input-${note!.id}-${index}`}>
											<TableCell>
												<input
													type="number"
													value={input}
													onChange={(e) => handleChangeInput(note!.id, e.target.value, index)}
													className="bg-transparent outline-none"
												/>
											</TableCell>
										</TableRow>
									))}
									<TableRow>
										<TableCell>
											<input
												type="number"
												value={newInput}
												placeholder="New input"
												onChange={(e) => setNewInput(e.target.value)}
												className="bg-transparent outline-none w-full"
												min={0}
											/>
										</TableCell>
									</TableRow>
								</TableBody>
							</Table>
						</div>
						<button
							onClick={handleAddInput}
							className="w-full mt-2 rounded-theme text-sm text-center transition-all px-4 py-1 bg-theme-surface-highlight  text-theme-text hover:bg-theme-border"
						>
							Create input
						</button>
					</div>
					<div className="mt-6 mb-2">VAULT</div>
					<Vault noteId={file.content.dynamic.note.noteId} addAssetAbility />
					<div className="mt-6">METADATA</div>
					<div className="w-fit mt-2">
						<div className={'rounded-theme border border-theme-border overflow-hidden'}>
							<Table className="[&_tr:hover]:bg-transparent">
								<TableBody>
									<TableRow>
										<TableHead className="pr-4">Sender ID</TableHead>
										<TableCell className="pr-8 last:p-2">
											({accounts[note!.senderId]!.id.prefix.toString()},{' '}
											{accounts[note!.senderId]!.id.suffix.toString()})
										</TableCell>
									</TableRow>
									<TableRow>
										<TableHead className="pr-4">Serial number</TableHead>
										<TableCell className="pr-8 last:p-2">
											{note!.serialNumberDecimalString}
										</TableCell>
									</TableRow>
									<TableRow>
										<TableHead>Aux</TableHead>
										<TableCell>
											<input
												value={note!.aux.toString()}
												type="number"
												className="bg-transparent outline-none w-20"
												min={0}
												onChange={(e) => setNoteAux(note!.id, BigInt(e.target.value))}
											/>
										</TableCell>
									</TableRow>
									<TableRow>
										<TableHead>Tag</TableHead>
										<TableCell>
											<input
												value={note!.tag}
												type="number"
												className="bg-transparent outline-none w-20"
												min={0}
												onChange={(e) => setNoteTag(note!.id, parseInt(e.target.value))}
											/>
										</TableCell>
									</TableRow>
									<TableRow>
										<TableHead>Recipient</TableHead>
										<TableCell>{note!.recipientDigest}</TableCell>
									</TableRow>
								</TableBody>
							</Table>
						</div>
					</div>
				</div>
				<ScrollBar orientation="horizontal" />
			</ScrollArea>
		);
	} else {
		return (
			<div className={`flex-1 bg-[#040113] ${'step8'}`}>
				<CustomMonacoEditor
					onChange={(value) => {
						setValue(value ?? '');
						if (file && !file.readonly) updateFileContent(file.id, value ?? '');
					}}
					readOnly={file.readonly}
					value={value}
				/>
			</div>
		);
	}
};
